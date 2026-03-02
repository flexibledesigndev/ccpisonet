#[cfg_attr(mobile, tauri::mobile_entry_point)]

use std::fs;

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

use std::net::Ipv4Addr;

struct KeyBlockerState(Mutex<Option<Child>>);
struct WindowsCCState(Mutex<Option<Child>>);

fn first_ipv4_in_text(s: &str) -> Option<String> {
    for token in s
        .replace(":", " ")
        .replace("\r", " ")
        .replace("\n", " ")
        .split_whitespace()
    {
        if token.parse::<Ipv4Addr>().is_ok() {
            return Some(token.to_string());
        }
    }
    None
}

#[tauri::command]
fn get_default_gateway_ip() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        // ipconfig is available everywhere on Windows
        let out = Command::new("ipconfig")
            .output()
            .map_err(|e| format!("Failed to run ipconfig: {}", e))?;

        let text = String::from_utf8_lossy(&out.stdout);

        // "Default Gateway" can appear with blank value then next line contains the IP
        let mut hit = false;
        for line in text.lines() {
            if line.contains("Default Gateway") {
                hit = true;

                // Try same line first
                if let Some(ip) = first_ipv4_in_text(line) {
                    return Ok(ip);
                }
                // Otherwise next line might contain it
                continue;
            }

            if hit {
                if let Some(ip) = first_ipv4_in_text(line) {
                    return Ok(ip);
                }
                // stop searching after a couple lines if no IP found
                hit = false;
            }
        }

        return Err("Default gateway not found (Windows)".to_string());
    }

    #[cfg(target_os = "linux")]
    {
        let out = Command::new("sh")
            .arg("-c")
            .arg("ip route show default 2>/dev/null")
            .output()
            .map_err(|e| format!("Failed to run ip route: {}", e))?;

        let text = String::from_utf8_lossy(&out.stdout);
        // typical: "default via 192.168.1.1 dev wlan0 ..."
        if let Some(pos) = text.find(" via ") {
            let tail = &text[pos + 5..];
            if let Some(ip) = first_ipv4_in_text(tail) {
                return Ok(ip);
            }
        }

        Err("Default gateway not found (Linux)".to_string())
    }

    #[cfg(target_os = "macos")]
    {
        let out = Command::new("sh")
            .arg("-c")
            .arg("route -n get default 2>/dev/null")
            .output()
            .map_err(|e| format!("Failed to run route: {}", e))?;

        let text = String::from_utf8_lossy(&out.stdout);
        // contains: "gateway: 192.168.1.1"
        for line in text.lines() {
            if line.trim_start().starts_with("gateway:") {
                if let Some(ip) = first_ipv4_in_text(line) {
                    return Ok(ip);
                }
            }
        }

        Err("Default gateway not found (macOS)".to_string())
    }

    #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
    {
        Err("Unsupported OS".to_string())
    }
}

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
fn force_exit(
    key_state: State<'_, KeyBlockerState>,
    wcc_state: State<'_, WindowsCCState>,
) -> Result<(), String> {
    // Stop child processes before exiting
    if let Some(mut child) = key_state.0.lock().unwrap().take() {
        let _ = child.kill();
    }
    if let Some(mut child) = wcc_state.0.lock().unwrap().take() {
        let _ = child.kill();
    }
    // Exit immediately, bypasses the on_window_event relaunch handler
    std::process::exit(0);
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
        start_blocker,
        stop_blocker,
        start_windowscc,
        stop_windowscc,
        get_default_gateway_ip,
        force_exit
    ])
    .on_window_event(|window, event| {
        if let tauri::WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();

            let state = window.state::<KeyBlockerState>();
            let _ = stop_blocker(state);

            let windowscc_state = window.state::<WindowsCCState>();
            let _ = stop_windowscc(windowscc_state);

            // Always relaunch on close
            let app_handle = window.app_handle();
            app_handle.restart();
        }
    })    
    .run(tauri::generate_context!())
    .expect("error while running tauri application");

}
