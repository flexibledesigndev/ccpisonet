#[cfg_attr(mobile, tauri::mobile_entry_point)]

use std::fs;
use serde_json::Value;

use std::env;
use reqwest;

use std::{
    process::{Child, Command},
    sync::Mutex,
};
use tauri::{AppHandle, Manager, State};
use tauri::path::BaseDirectory;

// no window hide in the background
use std::os::windows::process::CommandExt; 

struct KeyBlockerState(Mutex<Option<Child>>);
struct WindowsCCState(Mutex<Option<Child>>);

#[tauri::command]
fn start_blocker(app_handle: AppHandle, state: tauri::State<'_, KeyBlockerState>) -> Result<(), String> {
    let mut guard = state.0.lock().unwrap();

    // Check if a child process is already running
    if let Some(child) = &mut *guard {
        // Check if child is still running
        if let Ok(Some(_)) = child.try_wait() {
            // Process has exited, so we can spawn a new one
        } else {
            // Process is still running, don't spawn duplicate
            return Ok(());
        }
    }

    let exe_path = app_handle
        .path()
        .resolve("keyblocker.exe", BaseDirectory::Resource)
        .map_err(|e| e.to_string())?;

    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let child = Command::new(exe_path)
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()
        .map_err(|e| e.to_string())?;

    *guard = Some(child);

    Ok(())
}


// Stop the keyblocker.exe process
#[tauri::command]
fn stop_blocker(state: State<'_, KeyBlockerState>) -> Result<(), String> {
    if let Some(mut child) = state.0.lock().unwrap().take() {
        child.kill().map_err(|e| e.to_string())?;
    }
    Ok(())
}


#[tauri::command]
fn start_windowscc(app_handle: AppHandle, state: tauri::State<'_, WindowsCCState>) -> Result<(), String> {
    let mut guard = state.0.lock().unwrap();

    // Check if a child process is already running
    if let Some(child) = &mut *guard {
        // Check if child is still running
        if let Ok(Some(_)) = child.try_wait() {
            // Process has exited, so we can spawn a new one
        } else {
            // Process is still running, don't spawn duplicate
            return Ok(());
        }
    }

    let exe_path = app_handle
        .path()
        .resolve("windowsCC.exe", BaseDirectory::Resource)
        .map_err(|e| e.to_string())?;

    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let child = Command::new(exe_path)
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()
        .map_err(|e| e.to_string())?;

    *guard = Some(child);

    Ok(())
}


#[tauri::command]
fn stop_windowscc(state: State<'_, WindowsCCState>) -> Result<(), String> {
    if let Some(mut child) = state.0.lock().unwrap().take() {
        child.kill().map_err(|e| e.to_string())?;
    }
    Ok(())
}


#[tauri::command]
fn get_default_gateway() -> Option<String> {
    let output = Command::new("ipconfig")
        .output()
        .ok()?;

    let stdout = String::from_utf8_lossy(&output.stdout);

    for line in stdout.lines() {
        if line.trim().starts_with("Default Gateway") {
            let parts: Vec<&str> = line.split(':').collect();
            if parts.len() > 1 {
                let gateway = parts[1].trim();
                if !gateway.is_empty() {
                    return Some(gateway.to_string());
                }
            }
        }
    }
    None
}

#[tauri::command]
async fn fetch_html(url: String) -> Result<String, String> {
    use reqwest::Client;
    use std::time::Duration;

    let client = Client::builder()
        .timeout(Duration::from_secs(5)) // timeout for slow connections
        .build()
        .map_err(|e| e.to_string())?;

    let res = client.get(&url)
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("HTTP error: {}", res.status()));
    }

    res.text()
        .await
        .map_err(|e| format!("Failed to read body: {}", e))
}

#[tauri::command]
fn get_hostname() -> String {
    match env::var("COMPUTERNAME") {
        Ok(hostname) => hostname,
        Err(_) => "Unknown PC".to_string()
    }
}

#[tauri::command]
fn shutdown_pc() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("shutdown")
            .args(["/s", "/t", "0"])
            .output()
            .map_err(|e| format!("Failed to shutdown: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
fn get_settings(app_handle: AppHandle) -> Result<String, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|_| "Failed to get app directory".to_string())?;
    let settings_path = app_dir.join("settings.json");

    if !settings_path.exists() {
        return Ok("".to_string());
    }

    fs::read_to_string(settings_path)
        .map_err(|e| format!("Failed to read settings: {}", e))
}

#[tauri::command]
fn save_settings(app_handle: AppHandle, settings: String) -> Result<(), String> {

    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|_| "Failed to get app directory".to_string())?;

    // Create app directory if it doesn't exist
    fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create app directory: {}", e))?;

    let settings_path = app_dir.join("settings.json");
    fs::write(settings_path, settings)
        .map_err(|e| format!("Failed to save settings: {}", e))?;

    Ok(())
}

pub fn run() {
  tauri::Builder::default()
    .manage(KeyBlockerState(std::sync::Mutex::new(None)))
    .manage(WindowsCCState(std::sync::Mutex::new(None)))
    .invoke_handler(tauri::generate_handler![
        get_settings,
        save_settings,
        get_hostname, 
        shutdown_pc,
        fetch_html,
        get_default_gateway,
        start_blocker,
        stop_blocker,
        start_windowscc,
        stop_windowscc
    ])
    .on_window_event(|window, event| {
        if let tauri::WindowEvent::CloseRequested { api, .. } = event {
            let state = window.state::<KeyBlockerState>();
            let _ = stop_blocker(state); // ignore errors          
            
            let windowscc_state = window.state::<WindowsCCState>();
            let _ = stop_windowscc(windowscc_state); // ignore errors     

            let app_handle = window.app_handle();

            // Read settings.json safely
            let relaunch = match app_handle.path().app_data_dir() {
                Ok(app_dir) => {
                    let settings_path = app_dir.join("settings.json");
                    if let Ok(settings_str) = fs::read_to_string(settings_path) {
                        if let Ok(settings_json) = serde_json::from_str::<Value>(&settings_str) {
                            settings_json.get("relaunchOnClose").and_then(|v| v.as_bool()).unwrap_or(true)
                        } else {
                            true // default relaunch if JSON parse fails
                        }
                    } else {
                        true // default relaunch if reading fails
                    }
                }
                Err(_) => true, // default relaunch if path fails
            };
    
            if relaunch {
                api.prevent_close();
                app_handle.restart();
            }            

        }
    })    
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
