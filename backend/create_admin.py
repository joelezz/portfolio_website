# create_admin.py
from dotenv import load_dotenv
from app import create_app, db # Import create_app and db instance
from app.models import AdminUser # Import AdminUser model
import os
import sys

load_dotenv('.env.local')

app_instance = create_app() # Create an app instance

def create_admin():
    with app_instance.app_context(): # Use the created app instance's context
        # ... rest of your create_admin logic ...
        # (ensure AdminUser and db are correctly referenced)
# ...
        username = 'admin' # Or get from input/env if you prefer
        password = os.environ.get('ADMIN_PASSWORD')

        if not password:
            print("Error: ADMIN_PASSWORD environment variable not set.")
            print("Please set it in your .env file or environment.")
            sys.exit(1) # Exit the script if password is not found

        # Check if admin already exists
        existing_admin = AdminUser.query.filter_by(username=username).first()
        if existing_admin:
            print(f"Admin user '{username}' already exists.")
            return

        admin = AdminUser(username=username)
        admin.set_password(password) # Password hashing happens here
        db.session.add(admin)
        db.session.commit()
        print(f"Admin user '{username}' created successfully.")

if __name__ == '__main__':
    create_admin()