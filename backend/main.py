# main.py
import os
from flask import Flask, request, jsonify, url_for, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.exc import IntegrityError, DataError
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
import resend  # Add this import at the top

# --- JWT IMPORT ---
from flask_jwt_extended import create_access_token, jwt_required, JWTManager, get_jwt_identity

load_dotenv('.env.local')

# --- General Configuration ---
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

app = Flask(__name__)

# Updated CORS configuration
allowed_origins = os.environ.get(
    'ALLOWED_ORIGINS',
    'http://localhost:5173,https://www.joelezzahid.com'
).split(',')

CORS(
    app,
    resources={r"/api/*": {"origins": allowed_origins}},
    allow_headers=["Authorization", "Content-Type"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    supports_credentials=True
)

# --- App Configuration ---
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'your_very_strong_and_unique_secret_key_here_CHANGE_ME')
app.config['JWT_SECRET_KEY'] = app.config['SECRET_KEY']
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)

# PostgreSQL Config
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
            if include_image_url_base:
                image_full_url = f"{include_image_url_base.rstrip('/')}{url_for('uploaded_file', filename=self.image_filename)}"
            else:
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

class ContactSubmission(db.Model):
    __tablename__ = 'contact_submissions'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(50), nullable=True)
    message = db.Column(db.Text, nullable=False)
    submission_date = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f'<ContactSubmission {self.name} - {self.email}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'message': self.message,
            'submission_date': self.submission_date.isoformat() if self.submission_date else None
        }

# --- Helper Functions ---
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_image(file_storage):
    if file_storage and file_storage.filename and allowed_file(file_storage.filename):
        filename = secure_filename(file_storage.filename)
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

def send_notification_email(submission):
    """Send email notification using Resend"""
    resend.api_key = os.environ.get('RESEND_API_KEY')
    print("running the send notification function") #
    notification_email = os.environ.get('NOTIFICATION_EMAIL')
    
    if not resend.api_key or not notification_email:
        app.logger.warning("Email notification skipped: Missing RESEND_API_KEY or NOTIFICATION_EMAIL")
        return False
    
    try:
        resend.Emails.send({
            "from": "Portfolio <hello@joelezzahid.com>", 
            "to": notification_email,
            "subject": f"New Contact Form Submission from {submission.name}",
            "html": f"""
            <h2>New Contact Form Submission</h2>
            <p><strong>Date:</strong> {submission.submission_date.strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
            <hr>
            <p><strong>Name:</strong> {submission.name}</p>
            <p><strong>Email:</strong> <a href="mailto:{submission.email}">{submission.email}</a></p>
            <p><strong>Phone:</strong> {submission.phone or 'Not provided'}</p>
            <hr>
            <p><strong>Message:</strong></p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
                <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">{submission.message}</pre>
            </div>
            """
        })
        app.logger.info(f"Notification email sent successfully for submission from {submission.name}")
        return True
    except Exception as e:
        app.logger.error(f"Failed to send email: {e}")
        return False

# --- API Endpoints ---

# Authentication & Admin User Management
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

# --- Admin Project CRUD APIs ---
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
                    if len(image_filename_candidate) > 100: 
                        errors['image'] = "Processed image filename is too long (max 100). Try a shorter original filename."
                    else:
                        image_filename = image_filename_candidate
                else: 
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
    except IntegrityError as e: 
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
    name = request.form.get('name', project.name) 
    description = request.form.get('description', project.description if project.description is not None else '')
    project_url = request.form.get('project_url', project.project_url if project.project_url is not None else '')
    
    if not name or len(name.strip()) == 0:
        errors['name'] = "Project name is required and cannot be empty."
    elif len(name) > 100:
        errors['name'] = "Project name must be 100 characters or less."
    if project_url and len(project_url) > 255: 
        errors['project_url'] = "Project URL must be 255 characters or less."

    new_image_filename = project.image_filename 
    if 'image' in request.files:
        file_storage = request.files['image']
        if file_storage and file_storage.filename: 
            if not allowed_file(file_storage.filename):
                errors['image'] = f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}."
            else:
                candidate_filename = save_image(file_storage)
                if candidate_filename:
                    if len(candidate_filename) > 100:
                            errors['image'] = "Processed new image filename is too long (max 100)."
                    else:
                        if project.image_filename:
                            old_image_path = os.path.join(app.config['UPLOAD_FOLDER'], project.image_filename)
                            if os.path.exists(old_image_path):
                                try: os.remove(old_image_path)
                                except OSError as e: app.logger.warning(f"Error deleting old image {project.image_filename}: {e}")
                        new_image_filename = candidate_filename 
                else: 
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
        image_to_delete = project.image_filename 
        db.session.delete(project)
        db.session.commit()
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

# --- PUBLIC API Endpoint ---
@app.route('/api/projects', methods=['GET'])
def get_public_projects_api():
    app.logger.info("Public request to /api/projects")
    try:
        projects = Project.query.order_by(Project.date_added.desc()).all()
        return jsonify([p.to_dict(include_image_url_base=request.host_url) for p in projects])
    except Exception as e:
        app.logger.error(f"Error fetching public projects: {e}", exc_info=True)
        return jsonify({"message": "Could not retrieve projects", "error_details": str(e)}), 500

# --- Route to serve uploaded files ---
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# --- Contact Form API Endpoints ---
@app.route('/api/form_submit', methods=['POST'])
def handle_form_submit():
    """
    Handles submissions from the main contact form.
    Expects JSON: {"name": "...", "email": "...", "phone": "...", "message": "..."}
    """
    if not request.is_json:
        return jsonify({"message": "Request must be JSON"}), 400

    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone')  # Optional
    message = data.get('message')

    errors = {}
    if not name: errors['name'] = "Name is required."
    if not email: errors['email'] = "Email is required."
    if not message: errors['message'] = "Message is required."
    # Basic email format check
    if email and '@' not in email: errors['email_format'] = "Invalid email format."

    if errors:
        return jsonify({"message": "Validation errors", "errors": errors}), 422

    try:
        new_submission = ContactSubmission(
            name=name,
            email=email,
            phone=phone,
            message=message
        )
        db.session.add(new_submission)
        db.session.commit()
        app.logger.info(f"New contact form submission from {name} ({email}).")
        
        # Send email notification (non-blocking)
        email_sent = send_notification_email(new_submission)
        
        response_data = {
            "message": "Form submitted successfully!",
            "submission": new_submission.to_dict()
        }
        
        # Optionally include email status in debug mode
        if app.debug:
            response_data["email_notification_sent"] = email_sent
            
        return jsonify(response_data), 201
        
    except IntegrityError as e:
        db.session.rollback()
        app.logger.error(f"Database integrity error on form submission: {e}", exc_info=True)
        return jsonify({"message": "Could not process form due to a database conflict.", "error_details": str(e.orig)}), 409
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error processing form submission: {e}", exc_info=True)
        return jsonify({"message": "An unexpected error occurred while processing the form.", "error_details": str(e)}), 500

@app.route('/api/form_data', methods=['POST'])
def handle_form_data_ping():
    """
    Handles the POST request made by the frontend's useEffect on mount.
    Expects JSON: {"form_name": "...", "form_email": "...", "form_phone": "...", "form_message": "..."}
    Currently, this endpoint just logs the data and acknowledges.
    """
    if not request.is_json:
        return jsonify({"message": "Request must be JSON"}), 400

    data = request.get_json()
    app.logger.info(f"Received initial form data ping: {data}")

    return jsonify({"message": "Initial form data received."}), 200

# --- Admin Contact Submission Endpoints ---
@app.route('/api/admin/contact-submissions', methods=['GET'])
@jwt_required()
def admin_get_contact_submissions():
    current_user_id = get_jwt_identity()
    app.logger.info(f"Admin user {current_user_id} fetching contact submissions.")
    
    try:
        # Get query parameters for pagination
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Query with pagination
        submissions = ContactSubmission.query.order_by(
            ContactSubmission.submission_date.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'submissions': [s.to_dict() for s in submissions.items],
            'total': submissions.total,
            'pages': submissions.pages,
            'current_page': page
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error fetching contact submissions: {e}", exc_info=True)
        return jsonify({"message": "Could not retrieve submissions", "error_details": str(e)}), 500

@app.route('/api/admin/contact-submissions/<int:submission_id>', methods=['GET'])
@jwt_required()
def admin_get_contact_submission(submission_id):
    current_user_id = get_jwt_identity()
    submission = db.session.get(ContactSubmission, submission_id)
    
    if not submission:
        return jsonify({"message": "Submission not found"}), 404
        
    return jsonify(submission.to_dict()), 200

@app.route('/api/admin/contact-submissions/<int:submission_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_contact_submission(submission_id):
    current_user_id = get_jwt_identity()
    submission = db.session.get(ContactSubmission, submission_id)
    
    if not submission:
        return jsonify({"message": "Submission not found"}), 404
        
    try:
        db.session.delete(submission)
        db.session.commit()
        app.logger.info(f"Contact submission ID {submission_id} deleted by admin {current_user_id}.")
        return jsonify({"message": "Submission deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error deleting submission ID {submission_id}: {e}", exc_info=True)
        return jsonify({"message": "Failed to delete submission", "error_details": str(e)}), 500

# --- Database Initialization ---
with app.app_context():
    db.create_all()
    print("Database tables checked/created (AdminUser, Project, ContactSubmission).")
    
    admin_username = os.environ.get('DEFAULT_ADMIN_USERNAME', 'admin')
    if not AdminUser.query.filter_by(username=admin_username).first():
        default_admin_password = os.environ.get('DEFAULT_ADMIN_PASSWORD', 'adminpass123')
        admin = AdminUser(username=admin_username)
        admin.set_password(default_admin_password)
        db.session.add(admin)
        db.session.commit()
        print(f"Default admin user '{admin_username}' created/ensured.")
    elif os.environ.get('RESET_ADMIN_PASSWORD') and AdminUser.query.filter_by(username=admin_username).first():
        admin_to_reset = AdminUser.query.filter_by(username=admin_username).first()
        admin_to_reset.set_password(os.environ.get('RESET_ADMIN_PASSWORD'))
        db.session.commit()
        print(f"Admin user '{admin_username}' password has been reset.")

if __name__ == '__main__':
    is_debug_mode = os.environ.get('FLASK_DEBUG', '0').lower() in ['true', '1', 't']
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=is_debug_mode)