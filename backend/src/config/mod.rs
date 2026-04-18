use std::env;

#[derive(Clone, Debug)]
pub struct AppConfig {
    pub database_url: String,
    pub secret_key: String,
    pub frontend_url: String,
}

impl AppConfig {
    pub fn new() -> Self {
        Self {
            database_url: env::var("DATABASE_URL").expect("DATABASE_URL must be set"),
            secret_key: env::var("SECRET_KEY").expect("SECRET_KEY must be set"),
            frontend_url: env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:3000".to_string()),
        }
    }
}
  
