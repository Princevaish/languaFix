# utils/validators.py
from typing import Optional, Tuple
import re


class InputValidator:
    """Validates input data for text processing"""
    
    MIN_TEXT_LENGTH = 1
    MAX_TEXT_LENGTH = 50000
    
    @staticmethod
    def validate_text(text: str) -> Tuple[bool, Optional[str]]:
        """
        Validate input text
        
        Args:
            text: Input text to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if not text or not isinstance(text, str):
            return False, "Text is required and must be a string"
        
        text = text.strip()
        
        if len(text) < InputValidator.MIN_TEXT_LENGTH:
            return False, "Text is too short"
        
        if len(text) > InputValidator.MAX_TEXT_LENGTH:
            return False, f"Text exceeds maximum length of {InputValidator.MAX_TEXT_LENGTH} characters"
        
        return True, None
    
    @staticmethod
    def sanitize_text(text: str) -> str:
        """
        Sanitize input text
        
        Args:
            text: Input text
            
        Returns:
            Sanitized text
        """
        # Remove null bytes and other control characters
        text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)
        return text.strip()
    
    @staticmethod
    def validate_file_extension(filename: str, allowed_extensions: set) -> bool:
        """
        Validate file extension
        
        Args:
            filename: Name of the file
            allowed_extensions: Set of allowed extensions
            
        Returns:
            True if valid, False otherwise
        """
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in allowed_extensions