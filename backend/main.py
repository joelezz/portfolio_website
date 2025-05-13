# main.py (Merged)
import os
from flask import Flask, request, jsonify, render_template, redirect, url_for, flash, send_from_directory
from flask_restful import Resource, Api
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, URLField, SubmitField
from wtforms.validators import DataRequired, Optional, URL
from flask_wtf.file import FileField, FileAllowed # FileRequired removed as image is optional on edit
from werkzeug.utils import secure_filename
from datetime import datetime

# --- General Configuration ---
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads') # For project images
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

app = Flask(__name__)
CORS(app) # Enable CORS for all routes, or configure more specifically
api = Api(app) # For your existing RESTful APIs

# --- App Configuration ---
# Secret Key (IMPORTANT: Change for production and keep it secret!)
app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY', 'your_very_strong_and_unique_secret_key_here')

# PostgreSQL Config (from your existing setup)
app.config['SQLALCHEMY_DATABASE_URI'] = (
    "postgresql+psycopg2://avnadmin:AVNS_JlCjlzMynSrx3MbSw80"
    "@pg-266c3d3b-joel-1ee4.i.aivencloud.com:19622/defaultdb"
    "?sslmode=require"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Flask-Mail Config (from your existing setup)
app.config['MAIL_SERVER']='smtp.hostinger.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USERNAME'] = 'joel@duoai.tech' # Consider using environment variables
app.config['MAIL_PASSWORD'] = 'Halsuantie9c20!'   # Consider using environment variables
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True

# File Upload Config (for portfolio projects)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
# app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024 # Optional: Limit file upload size (e.g., 16MB)

# --- Initialize Extensions ---
db = SQLAlchemy(app)
mail = Mail(app)

# Create upload folder if it doesn't exist
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
    print(f"Created upload folder at: {UPLOAD_FOLDER}")

# --- Database Models ---

# FormData Model (from your existing setup)
class FormData(db.Model):
    __tablename__ = 'form_data' # Explicitly naming table
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(100))
    phone = db.Column(db.String(20)) # Consider E.164 format or more flexible String length
    message = db.Column(db.Text)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "message": self.message
        }

# Project Model (for portfolio dashboard)
class Project(db.Model):
    __tablename__ = 'projects' # Explicitly naming table
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    project_url = db.Column(db.String(255), nullable=True) # Increased length for URLs
    image_filename = db.Column(db.String(100), nullable=True) # Stores filename of the uploaded image
    date_added = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Project {self.name}>'

# --- Forms (for portfolio dashboard) ---
class ProjectForm(FlaskForm):
    name = StringField('Project Name', validators=[DataRequired()])
    description = TextAreaField('Description')
    project_url = URLField('Project URL (e.g., GitHub, Live Demo)', validators=[Optional(), URL()])
    # Image is not FileRequired because it's optional when editing an existing project
    image = FileField('Project Image', validators=[
        FileAllowed(ALLOWED_EXTENSIONS, 'Images only! (png, jpg, jpeg, gif, webp)')
    ])
    submit = SubmitField('Save Project')

# --- Helper Functions (for portfolio dashboard image uploads) ---
def allowed_file(filename):
    """Checks if the filename has an allowed extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_image(file_storage):
    """
    Saves the image to the UPLOAD_FOLDER and returns the filename.
    Returns None if no file, empty filename, or not an allowed file type.
    A more robust implementation would ensure unique filenames (e.g., using UUIDs).
    """
    if file_storage and file_storage.filename and allowed_file(file_storage.filename):
        filename = secure_filename(file_storage.filename)
        # Consider making filenames unique to prevent overwrites:
        # import uuid
        # _, ext = os.path.splitext(filename)
        # filename = f"{uuid.uuid4().hex}{ext}"
        try:
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file_storage.save(file_path)
            return filename
        except Exception as e:
            app.logger.error(f"Failed to save image {filename}: {e}")
            flash(f"Error saving image: {e}", "danger") # Flash message to user
            return None
    elif file_storage and file_storage.filename and not allowed_file(file_storage.filename):
        flash(f"File type not allowed for {file_storage.filename}. Allowed: {', '.join(ALLOWED_EXTENSIONS)}", "danger")
        return None
    return None


# --- API Resources (Your existing Flask-RESTful APIs) ---
class FormAPI(Resource):
    def get(self, form_id):
        form = db.session.get(FormData, form_id) # Updated to use db.session.get for SQLAlchemy 2.0+
        if not form:
            return {"message": "Form not found"}, 404
        return form.to_dict(), 200

api.add_resource(FormAPI, '/form/<int:form_id>')

# --- Standard Flask Routes ---

# Your existing form submission route
@app.route('/form_submit', methods=['POST'])
def add_form_data():
    data = request.get_json()
    if not data:
        return jsonify({"status": "error", "message": "No input data provided"}), 400

    form = FormData(
        name=data.get("name"),
        email=data.get("email"),
        phone=data.get("phone"),
        message=data.get("message")
    )
    # Basic validation example
    if not form.name or not form.email:
        return jsonify({"status": "error", "message": "Name and Email are required"}), 400
    
    try:
        db.session.add(form)
        db.session.commit()
        
        # Send email notification
        msg = Message(
            'New submission from a form @ duoai.tech',
            sender=app.config['MAIL_USERNAME'], # Use configured sender
            recipients=['joel.ezzahid@gmail.com', 'joel@duoai.tech']
        )
        msg.body = f'New submission from {form.name} ({form.email}) with the message: {form.message}'
        mail.send(msg)
        
        return jsonify({"status": "success", "data": form.to_dict(), "message": "Form submitted and email sent successfully."}), 201
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error in form submission or email sending: {e}")
        return jsonify({"status": "error", "message": f"An internal error occurred: {e}"}), 500

# --- Portfolio Dashboard Routes ---
@app.route('/admin/')
# @login_required # TODO: Add authentication for admin routes
def dashboard():
    """Displays all projects in the admin dashboard."""
    projects = Project.query.order_by(Project.date_added.desc()).all()
    return render_template('dashboard.html', projects=projects, title="Admin Dashboard")

@app.route('/admin/add', methods=['GET', 'POST'])
# @login_required
def add_project():
    """Handles adding a new project."""
    form = ProjectForm()
    if form.validate_on_submit():
        image_filename = None
        if form.image.data: # Check if a file was uploaded
            image_filename = save_image(form.image.data)
            # save_image now flashes its own error if it fails, so we just check if a filename was returned
            if not image_filename and form.image.data.filename: # If upload was attempted but failed
                 # No need to flash again, save_image does it.
                 # The form will re-render with errors if any.
                 return render_template('project_form.html', form=form, title="Add New Project", action="Add")


        new_project = Project(
            name=form.name.data,
            description=form.description.data,
            project_url=form.project_url.data,
            image_filename=image_filename
        )
        try:
            db.session.add(new_project)
            db.session.commit()
            flash('Project added successfully!', 'success')
            return redirect(url_for('dashboard'))
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error adding project: {e}")
            flash(f'Error adding project: {e}', 'danger')
            
    return render_template('project_form.html', form=form, title="Add New Project", action="Add")

@app.route('/admin/edit/<int:project_id>', methods=['GET', 'POST'])
# @login_required
def edit_project(project_id):
    """Handles editing an existing project."""
    project = db.session.get(Project, project_id) # Updated for SQLAlchemy 2.0+
    if not project:
        flash('Project not found.', 'danger')
        return redirect(url_for('dashboard'))
        
    form = ProjectForm(obj=project) # Pre-populate form with project data

    if form.validate_on_submit():
        project.name = form.name.data
        project.description = form.description.data
        project.project_url = form.project_url.data

        if form.image.data: # If a new image is uploaded
            # Delete the old image file if it exists
            if project.image_filename:
                old_image_path = os.path.join(app.config['UPLOAD_FOLDER'], project.image_filename)
                if os.path.exists(old_image_path):
                    try:
                        os.remove(old_image_path)
                    except OSError as e:
                        app.logger.warning(f"Error deleting old image {project.image_filename}: {e}")
                        flash(f"Warning: Could not delete old image file: {e}", "warning")
            
            new_image_filename = save_image(form.image.data)
            if new_image_filename:
                project.image_filename = new_image_filename
            elif form.image.data.filename: # Image upload was attempted but failed
                # save_image flashes its own error.
                # Retain old image if new one fails to save.
                # No need to flash again, form will re-render with errors.
                return render_template('project_form.html', form=form, title="Edit Project", project=project, action="Edit", current_image_url=url_for('uploaded_file', filename=project.image_filename) if project.image_filename else None)

        try:
            db.session.commit()
            flash('Project updated successfully!', 'success')
            return redirect(url_for('dashboard'))
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error updating project: {e}")
            flash(f'Error updating project: {e}', 'danger')
    
    current_image_url = None
    if project.image_filename:
        current_image_url = url_for('uploaded_file', filename=project.image_filename)

    return render_template('project_form.html', form=form, title="Edit Project", project=project, action="Edit", current_image_url=current_image_url)

@app.route('/admin/delete/<int:project_id>', methods=['POST']) # Use POST for deletion
# @login_required
def delete_project(project_id):
    """Handles deleting a project."""
    project = db.session.get(Project, project_id) # Updated for SQLAlchemy 2.0+
    if not project:
        flash('Project not found.', 'danger')
        return redirect(url_for('dashboard'))

    try:
        # Delete the associated image file
        if project.image_filename:
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], project.image_filename)
            if os.path.exists(image_path):
                try:
                    os.remove(image_path)
                except OSError as e:
                    app.logger.warning(f"Error deleting image file {project.image_filename}: {e}")
                    flash(f"Warning: Error deleting image file: {e}", "warning")

        db.session.delete(project)
        db.session.commit()
        flash('Project deleted successfully!', 'success')
    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error deleting project: {e}")
        flash(f'Error deleting project: {e}', 'danger')
        
    return redirect(url_for('dashboard'))

@app.route('/admin/uploads/<path:filename>') # Use <path:filename> for more flexibility with filenames
def uploaded_file(filename):
    """Serves uploaded files from the UPLOAD_FOLDER. Used to display images."""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


# --- API Endpoint for Frontend Portfolio (to fetch projects) ---
@app.route('/api/projects', methods=['GET'])
def get_projects_api():
    """API endpoint to fetch all projects. Your portfolio frontend can use this."""
    try:
        projects = Project.query.order_by(Project.date_added.desc()).all()
        project_list = []
        for p in projects:
            project_data = {
                'id': p.id,
                'name': p.name,
                'description': p.description,
                'project_url': p.project_url,
                # Ensure _external=True if your frontend is on a different domain/port during development
                'image_url': url_for('uploaded_file', filename=p.image_filename, _external=True) if p.image_filename else None,
                'date_added': p.date_added.isoformat() if p.date_added else None
            }
            project_list.append(project_data)
        return jsonify({'projects': project_list})
    except Exception as e:
        app.logger.error(f"Error fetching projects for API: {e}")
        return jsonify({"status": "error", "message": "Could not retrieve projects"}), 500

# --- Context Processors (Optional: make variables available to all templates) ---
@app.context_processor
def inject_now():
    return {'now': datetime.utcnow()}

# --- Create DB tables ---
# This should be run once, or managed with migrations (e.g., Flask-Migrate)
# For development, it's okay here. For production, use migrations.
with app.app_context():
    # db.drop_all() # Careful with this in production!
    db.create_all()
    print("Database tables checked/created (FormData, Project).")

if __name__ == '__main__':
    # For production, use a WSGI server like Gunicorn or Waitress
    # Example: gunicorn -w 4 -b 0.0.0.0:5000 main:app
    app.run(debug=True, host='0.0.0.0', port=5000) # debug=False for production


