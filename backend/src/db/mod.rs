use sqlx::{postgres::PgPoolOptions, PgPool};
use std::time::Duration;
use crate::config::AppConfig;

pub async fn init_pool() -> Result<PgPool, sqlx::Error> {
    let config = AppConfig::new();
    
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .acquire_timeout(Duration::from_secs(3))
        .connect(&config.database_url)
        .await?;

    // Run migrations automatically
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await?;

    Ok(pool)
}
 
