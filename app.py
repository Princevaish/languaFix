# app.py
from flask import Flask, request, render_template, jsonify
from typing import Dict, Any
import logging
import sys
from dotenv import load_dotenv
load_dotenv()

from config import config
from services.text_processor import TextProcessor
from utils.validators import InputValidator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('app.log')
    ]
)

logger = logging.getLogger(__name__)


def create_app(config_name: str = 'default') -> Flask:
    """
    Application factory pattern
    
    Args:
        config_name: Configuration name to use
        
    Returns:
        Configured Flask application
    """
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Set logging level from config
    logging.getLogger().setLevel(app.config['LOG_LEVEL'])
    
    return app


app = create_app()
text_processor = TextProcessor(language=app.config['LANGUAGE_TOOL_LANGUAGE'])


@app.errorhandler(400)
def bad_request(error):
    """Handle bad request errors"""
    return jsonify({'error': 'Bad request', 'message': str(error)}), 400


@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large errors"""
    return jsonify({
        'error': 'File too large',
        'message': 'The uploaded file exceeds the maximum allowed size'
    }), 413


@app.errorhandler(500)
def internal_server_error(error):
    """Handle internal server errors"""
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({
        'error': 'Internal server error',
        'message': 'An unexpected error occurred'
    }), 500


@app.route('/')
def index():
    """Render main page"""
    return render_template('index.html')


@app.route('/spell', methods=['POST'])
def spell():
    """
    Handle text correction via web form
    
    Returns:
        Rendered template with correction results
    """
    try:
        text = request.form.get('text', '').strip()
        
        # Validate input
        is_valid, error_message = InputValidator.validate_text(text)
        if not is_valid:
            logger.warning(f"Invalid text input: {error_message}")
            return render_template(
                'index.html',
                error=error_message
            )
        
        # Sanitize input
        text = InputValidator.sanitize_text(text)
        
        # Process text
        result = text_processor.process(text)
        
        # Format for template
        corrected_text = result.grammar_corrected_text
        
        # Format grammar errors for display
        grammar_summary = _format_grammar_errors_for_display(result.grammar_errors)
        
        return render_template(
            'index.html',
            corrected_text=corrected_text,
            corrected_grammar=grammar_summary,
            statistics=result.to_dict()['statistics']
        )
        
    except Exception as e:
        logger.error(f"Error in /spell endpoint: {str(e)}")
        return render_template(
            'index.html',
            error='An error occurred while processing your text'
        )


@app.route('/grammar', methods=['POST'])
def grammar():
    """
    Handle file upload and correction
    
    Returns:
        Rendered template with correction results
    """
    try:
        if 'file' not in request.files:
            return render_template('index.html', error='No file uploaded')
        
        file = request.files['file']
        
        if file.filename == '':
            return render_template('index.html', error='No file selected')
        
        # Validate file extension
        if not InputValidator.validate_file_extension(
            file.filename,
            app.config['ALLOWED_EXTENSIONS']
        ):
            return render_template(
                'index.html',
                error=f"Invalid file type. Allowed types: {', '.join(app.config['ALLOWED_EXTENSIONS'])}"
            )
        
        # Read and decode file
        try:
            text = file.read().decode('utf-8', errors='ignore').strip()
        except Exception as e:
            logger.error(f"Error reading file: {str(e)}")
            return render_template(
                'index.html',
                error='Error reading file. Please ensure it is a valid text file.'
            )
        
        # Validate text
        is_valid, error_message = InputValidator.validate_text(text)
        if not is_valid:
            return render_template('index.html', error=error_message)
        
        # Sanitize input
        text = InputValidator.sanitize_text(text)
        
        # Process text
        result = text_processor.process(text)
        
        # Format for template
        corrected_file_text = result.grammar_corrected_text
        grammar_summary = _format_grammar_errors_for_display(result.grammar_errors)
        
        return render_template(
            'index.html',
            corrected_file_text=corrected_file_text,
            corrected_file_grammar=grammar_summary,
            file_statistics=result.to_dict()['statistics']
        )
        
    except Exception as e:
        logger.error(f"Error in /grammar endpoint: {str(e)}")
        return render_template(
            'index.html',
            error='An error occurred while processing your file'
        )


@app.route('/api/check', methods=['POST'])
def api_check():
    """
    API endpoint for text checking
    
    Expected JSON input:
    {
        "text": "Your text here"
    }
    
    Returns:
        JSON response with structured correction data
    """
    try:
        # Validate content type
        if not request.is_json:
            return jsonify({
                'success': False,
                'error': 'Content-Type must be application/json'
            }), 400
        
        data = request.get_json()
        text = data.get('text', '').strip()
        
        # Validate input
        is_valid, error_message = InputValidator.validate_text(text)
        if not is_valid:
            return jsonify({
                'success': False,
                'error': error_message
            }), 400
        
        # Sanitize input
        text = InputValidator.sanitize_text(text)
        
        # Process text
        result = text_processor.process(text)
        
        # Return structured response
        response = {
            'success': True,
            'data': result.to_dict()
        }
        
        logger.info(f"API check completed successfully. Word count: {result.word_count}")
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Error in /api/check endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'An error occurred while processing your request'
        }), 500


def _format_grammar_errors_for_display(errors: list) -> str:
    """
    Format grammar errors for HTML display
    
    Args:
        errors: List of GrammarError objects
        
    Returns:
        Formatted string for display
    """
    if not errors:
        return "No grammar errors found! ✓"
    
    formatted = []
    for i, error in enumerate(errors, 1):
        suggestion = error.replacements[0] if error.replacements else "No suggestion"
        formatted.append(
            f"{i}. {error.message}\n"
            f"   Context: ...{error.context}...\n"
            f"   Suggestion: {suggestion}\n"
        )
    
    return "\n".join(formatted)


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'LanguaFix API'
    }), 200


if __name__ == '__main__':
    import os
    env = os.environ.get('FLASK_ENV', 'development')
    
    if env == 'production':
        logger.warning("Running in production mode. Use a production WSGI server.")
        app.run(host='0.0.0.0', port=5000, debug=False)
    else:
        logger.info("Running in development mode")
        app.run(debug=True)
