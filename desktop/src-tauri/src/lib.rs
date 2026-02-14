#[derive(serde::Serialize)]
struct SystemStats {
  cpu: f32,
  ram_used_mb: u64,
  ram_total_mb: u64,
  ram_percent: f32,
  gpu: Option<f32>,
}

#[tauri::command]
fn get_system_stats() -> Result<SystemStats, String> {
  use sysinfo::{CpuRefreshKind, MemoryRefreshKind, RefreshKind, System};

  let mut sys = System::new_with_specifics(
    RefreshKind::new()
      .with_memory(MemoryRefreshKind::everything())
      .with_cpu(CpuRefreshKind::everything()),
  );
  std::thread::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL);
  sys.refresh_cpu_usage();
  sys.refresh_memory();

  let cpu = sys.global_cpu_usage();
  let total_mem = sys.total_memory();
  let used_mem = sys.used_memory();
  let ram_total_mb = total_mem / (1024 * 1024);
  let ram_used_mb = used_mem / (1024 * 1024);
  let ram_percent = if total_mem > 0 {
    (used_mem as f64 / total_mem as f64 * 100.0) as f32
  } else {
    0.0
  };

  Ok(SystemStats {
    cpu: cpu.min(100.0).max(0.0),
    ram_used_mb,
    ram_total_mb,
    ram_percent,
    gpu: None,
  })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![get_system_stats])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
