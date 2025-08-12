#[cfg_attr(mobile, tauri::mobile_entry_point)]

use std::fs;
use serde_json::Value;
use tauri::{AppHandle, Manager};

use std::env;
use std::process::{Command};
use reqwest;

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
fn fetch_html(url: String) -> Result<String, String> {
    reqwest::blocking::get(&url)
        .and_then(|resp| resp.text())
        .map_err(|e| e.to_string())
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
    // Validate JSON
    let settings_json: Value = serde_json::from_str(&settings)
        .map_err(|e| format!("Invalid settings format: {}", e))?;

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

    // Update window settings
    if let Some(window) = app_handle.get_webview_window("main") {
        let allow_minimize = settings_json
            .get("allowMinimize")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);

        let always_on_top = settings_json
            .get("alwaysOnTop")
            .and_then(|v| v.as_bool())
            .unwrap_or(true);

        let _ = window.set_minimizable(allow_minimize);
        let _ = window.set_always_on_top(always_on_top);
    }

    Ok(())
}

pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
        get_settings,
        save_settings,
        get_hostname, 
        shutdown_pc,
        fetch_html,
        get_default_gateway
      ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
