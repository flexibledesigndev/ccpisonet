#[cfg_attr(mobile, tauri::mobile_entry_point)]

use std::env;
use std::process::{Command};
use reqwest;

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

pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
        get_hostname, 
        shutdown_pc,
        fetch_html
      ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
