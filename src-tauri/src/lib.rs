mod caffeinate;

use caffeinate::{
    get_caffeinate_status, start_caffeinate, stop_caffeinate, CaffeinateController,
};
use tauri::{Manager, RunEvent};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .manage(CaffeinateController::default())
        .invoke_handler(tauri::generate_handler![
            start_caffeinate,
            stop_caffeinate,
            get_caffeinate_status
        ])
        .build(tauri::generate_context!())
        .expect("error while building Caffeinate");

    app.run(|app_handle, event| {
        if let RunEvent::Exit = event {
            let controller = app_handle.state::<CaffeinateController>();
            if let Err(error) = controller.cleanup() {
                eprintln!("Caffeinate cleanup failed during exit: {error}");
            }
        }
    });
}
