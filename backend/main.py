# main.py (Corrected API Routes for Public and Admin)
import os
from flask import Flask, request, jsonify, url_for, send_from_directory # render_template, redirect, flash (if keeping server-side admin)
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.exc import IntegrityError, DataError
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

# --- JWT IMPORT ---
from flask_jwt_extended import create_access_token, jwt_required, JWTManager, get_jwt_identity

# Keeping these as they were in your last version, but they are not strictly needed for the React admin API focus
# from flask_restful import Resource, Api
# from flask_mail import Mail, Message
# from flask_wtf import FlaskForm
# from wtforms import StringField, TextAreaField, URLField, SubmitField
# from wtforms.validators import DataRequired, Optional, URL
# from flask_wtf.file import FileField, FileAllowed

load_dotenv('.env.local')

# --- General Configuration ---
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

app = Flask(__name__)

# Replace with a more specific configuration:
CORS(
    app,
    resources={r"/api/*": {"origins": "http://localhost:5173"}}, # Allow your React app's origin for all /api/* routes
    allow_headers=["Authorization", "Content-Type"], # Explicitly allow these headers
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"], # Explicitly allow these methods
    supports_credentials=True # If you plan to use cookies or authentication sessions that rely on credentials
    # expose_headers=["Authorization"] # Use if your login response sends a new token in an Authorization header that JS needs to read
)

# --- App Configuration ---
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'your_very_strong_and_unique_secret_key_here_CHANGE_ME')
app.config['JWT_SECRET_KEY'] = app.config['SECRET_KEY']
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1) # Or timedelta(days=1)

# PostgreSQL Config (using yours)
postgres_password = os.environ.get('POSTGRES_PASSWORD')
app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"postgresql+psycopg2://avnadmin:{postgres_password}"
    "@pg-266c3d3b-joel-1ee4.i.aivencloud.com:19622/defaultdb"
    "?sslmode=require"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# --- Initialize Extensions ---
db = SQLAlchemy(app)
jwt = JWTManager(app)
# mail = Mail(app) # If keeping contact form functionality
# api = Api(app)   # If keeping Flask-RESTful parts

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
    print(f"Created upload folder at: {UPLOAD_FOLDER}")

# --- Database Models ---
class AdminUser(db.Model):
    __tablename__ = 'admin_users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<AdminUser {self.username}>'

class Project(db.Model):
    __tablename__ = 'projects'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    project_url = db.Column(db.String(255), nullable=True)
    image_filename = db.Column(db.String(100), nullable=True)
    date_added = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f'<Project {self.name}>'

    def to_dict(self, include_image_url_base=None):
        image_full_url = None
        if self.image_filename:
            if include_image_url_base: # For absolute URLs needed by external clients
                image_full_url = f"{include_image_url_base.rstrip('/')}{url_for('uploaded_file', filename=self.image_filename)}"
            else: # For relative URLs if client is on same host/port or constructs it
                image_full_url = url_for('uploaded_file', filename=self.image_filename, _external=False)
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'project_url': self.project_url,
            'image_filename': self.image_filename,
            'image_url': image_full_url,
            'date_added': self.date_added.isoformat() if self.date_added else None
        }

# --- Helper Functions for File Upload ---
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_image(file_storage): # Renamed 'file' to 'file_storage' to avoid shadowing built-in
    if file_storage and file_storage.filename and allowed_file(file_storage.filename):
        filename = secure_filename(file_storage.filename)
        # Make filenames unique to prevent overwrites
        timestamp = datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')
        name, ext = os.path.splitext(filename)
        unique_filename = f"{name}_{timestamp}{ext}"
        try:
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            file_storage.save(file_path)
            return unique_filename
        except Exception as e:
            app.logger.error(f"Failed to save image {unique_filename}: {e}")
            return None
    return None

# --- API Endpoints ---

# Authentication & Admin User Management (prefixed with /api/admin/)
@app.route('/api/admin/register', methods=['POST'])
def register_admin_api():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({"message": "Username and password required"}), 400
    if AdminUser.query.filter_by(username=username).first():
        return jsonify({"message": "User already exists"}), 409
    new_user = AdminUser(username=username)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "Admin user created successfully. Please login."}), 201

@app.route('/api/admin/login', methods=['POST'])
def admin_login_api():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({"message": "Username and password required"}), 400
    user = AdminUser.query.filter_by(username=username).first()
    if user and user.check_password(password):
        access_token = create_access_token(identity=str(user.id))
        return jsonify(access_token=access_token, user={"id": user.id, "username": user.username}), 200
    return jsonify({"message": "Invalid credentials"}), 401

# --- Admin Project CRUD APIs (prefixed with /api/admin/ and protected) ---
@app.route('/api/admin/projects', methods=['GET'])
@jwt_required()
def admin_get_all_projects_api():
    current_user_id = get_jwt_identity()
    app.logger.info(f"Admin user {current_user_id} fetching all projects.")
    try:
        projects = Project.query.order_by(Project.date_added.desc()).all()
        return jsonify([p.to_dict(include_image_url_base=request.host_url) for p in projects]), 200
    except Exception as e:
        app.logger.error(f"Error fetching projects for admin {current_user_id}: {e}", exc_info=True)
        return jsonify({"message": "Could not retrieve projects", "error_details": str(e)}), 500

@app.route('/api/admin/projects', methods=['POST'])
@jwt_required()
def admin_create_project_api():
    current_user_id = get_jwt_identity()
    app.logger.info(f"Admin user {current_user_id} attempting to create a project.")
    app.logger.debug(f"Received Form Data for POST /api/admin/projects: {request.form}")
    app.logger.debug(f"Received Files for POST /api/admin/projects: {request.files}")

    errors = {}
    name = request.form.get('name')
    description = request.form.get('description', '')
    project_url = request.form.get('project_url', '')

    if not name or len(name.strip()) == 0:
        errors['name'] = "Project name is required and cannot be empty."
    elif len(name) > 100:
        errors['name'] = "Project name must be 100 characters or less."
    if project_url and len(project_url) > 255:
        errors['project_url'] = "Project URL must be 255 characters or less."

    image_filename = None
    if 'image' in request.files:
        file_storage = request.files['image']
        if file_storage and file_storage.filename:
            if not allowed_file(file_storage.filename):
                errors['image'] = f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}."
            else:
                image_filename_candidate = save_image(file_storage)
                if image_filename_candidate:
                    if len(image_filename_candidate) > 100: # Check length of processed filename
                        errors['image'] = "Processed image filename is too long (max 100). Try a shorter original filename."
                    else:
                        image_filename = image_filename_candidate
                else: # save_image returned None but a file was present
                    errors['image'] = "Image could not be saved. Check server logs or file type."
    if errors:
        return jsonify({"message": "Validation failed", "errors": errors}), 422

    try:
        new_project = Project(
            name=name.strip(),
            description=description.strip() if description else None,
            project_url=project_url.strip() if project_url else None,
            image_filename=image_filename
        )
        db.session.add(new_project)
        db.session.commit()
        app.logger.info(f"Project '{new_project.name}' created by admin {current_user_id}.")
        return jsonify(new_project.to_dict(include_image_url_base=request.host_url)), 201
    except IntegrityError as e: # Specific DB errors
        db.session.rollback()
        app.logger.error(f"DB IntegrityError on create project by admin {current_user_id}: {e}", exc_info=True)
        return jsonify({"message": "Database integrity error.", "error_details": str(e.orig)}), 409
    except DataError as e:
        db.session.rollback()
        app.logger.error(f"DB DataError on create project by admin {current_user_id}: {e}", exc_info=True)
        return jsonify({"message": "Database data error (e.g., data too long).", "error_details": str(e.orig)}), 422
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Unexpected error creating project by admin {current_user_id}: {e}", exc_info=True)
        return jsonify({"message": "An unexpected error occurred.", "error_details": str(e)}), 500


@app.route('/api/admin/projects/<int:project_id>', methods=['PUT'])
@jwt_required()
def admin_update_project_api(project_id):
    current_user_id = get_jwt_identity()
    project = db.session.get(Project, project_id)
    if not project:
        return jsonify({"message": "Project not found"}), 404
    
    app.logger.info(f"Admin user {current_user_id} attempting to update project ID {project_id}.")
    app.logger.debug(f"Received Form Data for PUT /api/admin/projects/{project_id}: {request.form}")
    app.logger.debug(f"Received Files for PUT /api/admin/projects/{project_id}: {request.files}")

    errors = {}
    name = request.form.get('name', project.name) # Default to current if not provided
    description = request.form.get('description', project.description if project.description is not None else '')
    project_url = request.form.get('project_url', project.project_url if project.project_url is not None else '')
    
    if not name or len(name.strip()) == 0:
        errors['name'] = "Project name is required and cannot be empty."
    elif len(name) > 100:
        errors['name'] = "Project name must be 100 characters or less."
    if project_url and len(project_url) > 255: # project_url can be empty string if user clears it
        errors['project_url'] = "Project URL must be 255 characters or less."

    new_image_filename = project.image_filename # Keep old image by default
    if 'image' in request.files:
        file_storage = request.files['image']
        if file_storage and file_storage.filename: # New image uploaded
            if not allowed_file(file_storage.filename):
                errors['image'] = f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}."
            else:
                # Delete old image file if it exists and a new one is successfully processed
                candidate_filename = save_image(file_storage)
                if candidate_filename:
                    if len(candidate_filename) > 100:
                         errors['image'] = "Processed new image filename is too long (max 100)."
                    else:
                        # Successfully saved new image, prepare to delete old one
                        if project.image_filename:
                            old_image_path = os.path.join(app.config['UPLOAD_FOLDER'], project.image_filename)
                            if os.path.exists(old_image_path):
                                try: os.remove(old_image_path)
                                except OSError as e: app.logger.warning(f"Error deleting old image {project.image_filename}: {e}")
                        new_image_filename = candidate_filename # Set project to use new image
                else: # save_image returned None
                    errors['image'] = "New image could not be saved. Check server logs or file type."
    if errors:
        return jsonify({"message": "Validation failed", "errors": errors}), 422

    project.name = name.strip()
    project.description = description.strip() if description else None
    project.project_url = project_url.strip() if project_url else None
    project.image_filename = new_image_filename

    try:
        db.session.commit()
        app.logger.info(f"Project ID {project_id} updated by admin {current_user_id}.")
        return jsonify(project.to_dict(include_image_url_base=request.host_url)), 200
    except IntegrityError as e:
        db.session.rollback()
        app.logger.error(f"DB IntegrityError on update project ID {project_id} by admin {current_user_id}: {e}", exc_info=True)
        return jsonify({"message": "Database integrity error during update.", "error_details": str(e.orig)}), 409
    except DataError as e:
        db.session.rollback()
        app.logger.error(f"DB DataError on update project ID {project_id} by admin {current_user_id}: {e}", exc_info=True)
        return jsonify({"message": "Database data error during update.", "error_details": str(e.orig)}), 422
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Unexpected error updating project ID {project_id} by admin {current_user_id}: {e}", exc_info=True)
        return jsonify({"message": "An unexpected error occurred during update.", "error_details": str(e)}), 500

@app.route('/api/admin/projects/<int:project_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_project_api(project_id):
    current_user_id = get_jwt_identity()
    project = db.session.get(Project, project_id)
    if not project:
        return jsonify({"message": "Project not found"}), 404
    try:
        image_to_delete = project.image_filename # Get filename before deleting project object
        db.session.delete(project)
        db.session.commit()
        # Delete the associated image file after successful DB deletion
        if image_to_delete:
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], image_to_delete)
            if os.path.exists(image_path):
                try: os.remove(image_path)
                except OSError as e: app.logger.warning(f"Error deleting image file {image_to_delete}: {e}")
        app.logger.info(f"Project ID {project_id} deleted by admin {current_user_id}.")
        return jsonify({"message": "Project deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error deleting project ID {project_id} by admin {current_user_id}: {e}", exc_info=True)
        return jsonify({"message": "Failed to delete project", "error_details": str(e)}), 500

# --- PUBLIC API Endpoint (for your React portfolio frontend to display projects) ---
@app.route('/api/projects', methods=['GET'])
# NO @jwt_required() here
def get_public_projects_api():
    app.logger.info("Public request to /api/projects")
    try:
        projects = Project.query.order_by(Project.date_added.desc()).all()
        # Pass request.host_url to generate absolute URLs for images
        return jsonify([p.to_dict(include_image_url_base=request.host_url) for p in projects])
    except Exception as e:
        app.logger.error(f"Error fetching public projects: {e}", exc_info=True)
        return jsonify({"message": "Could not retrieve projects", "error_details": str(e)}), 500

# --- Route to serve uploaded files ---
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# --- Your existing contact form submission route and other Flask-RESTful APIs ---
# (Keep them if needed, they are separate from the project admin API)
# class FormData(db.Model): ... (already defined)
# class FormAPI(Resource): ... (already defined by you)
# api.add_resource(FormAPI, '/form/<int:form_id>')
# @app.route('/form_submit', methods=['POST']) def add_form_data(): ... (already defined by you)

# --- Optional: Server-Side Rendered Admin (Comment out if not using with React Admin) ---
# If you are building a PURE React admin, these routes are not needed by React.
# They can be kept for direct server-side admin access if desired, or removed.
# from flask_wtf import FlaskForm
# from wtforms import StringField, TextAreaField, URLField, SubmitField, FileField
# from wtforms.validators import DataRequired, Optional, URL, FileAllowed
# class ProjectForm(FlaskForm): ... (already defined by you)

# @app.route('/admin/') ... (your server-side dashboard)
# @app.route('/admin/add', methods=['GET', 'POST']) ... (your server-side add project)
# @app.route('/admin/edit/<int:project_id>', methods=['GET', 'POST']) ...
# @app.route('/admin/delete/<int:project_id>', methods=['POST']) ...

# --- Initialize Database ---
def initialize_database():
    with app.app_context():
        db.create_all()
        print("Database tables checked/created (AdminUser, Project, FormData).")
        if not AdminUser.query.filter_by(username='admin').first():
            default_admin_password = os.environ.get('DEFAULT_ADMIN_PASSWORD', 'adminpass123') # CHANGE IN PRODUCTION
            admin = AdminUser(username='admin')
            admin.set_password(default_admin_password)
            db.session.add(admin)
            db.session.commit()
            print(f"Default admin user 'admin' created with password: {default_admin_password}. Please change this or use env var.")

if __name__ == '__main__':
    initialize_database()
    app.run(debug=True, host='0.0.0.0', port=5000)