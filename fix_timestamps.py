import sqlite3
import time
from datetime import datetime

# Connect to database
conn = sqlite3.connect('db.sqlite')
cursor = conn.cursor()

# Get all users and their timestamps
cursor.execute('SELECT id, username, created_at FROM users')
users = cursor.fetchall()

print("Current user timestamps:")
print("-" * 60)
for user_id, username, created_at in users:
    date_str = datetime.fromtimestamp(created_at).strftime('%Y-%m-%d %H:%M:%S') if created_at > 0 else 'Invalid (0 or negative)'
    print(f"ID: {user_id}, Username: {username}, Timestamp: {created_at}, Date: {date_str}")

# Check for invalid timestamps (0 or very small values)
invalid_users = [u for u in users if u[2] < 1000000000]  # Before year 2001

if invalid_users:
    print(f"\n{len(invalid_users)} users with invalid timestamps found!")
    print("Updating to current time...")
    
    # Get current Unix timestamp
    current_timestamp = int(time.time())
    print(f"Current timestamp: {current_timestamp} ({datetime.fromtimestamp(current_timestamp)})")
    
    # Update all invalid timestamps
    for user_id, username, old_ts in invalid_users:
        cursor.execute('UPDATE users SET created_at = ? WHERE id = ?', (current_timestamp, user_id))
        print(f"Updated user {username} (ID: {user_id}) from {old_ts} to {current_timestamp}")
    
    conn.commit()
    print(f"\n✅ Updated {len(invalid_users)} user(s) successfully!")
else:
    print("\n✅ All user timestamps are valid!")

conn.close()
