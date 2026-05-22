# services/spell_checker.py
from textblob import TextBlob
from typing import List, Dict, Any
import logging


logger = logging.getLogger(__name__)


class SpellingError:
    """Represents a spelling error"""
    
    def __init__(self, original: str, correction: str, position: int):
        self.original = original
        self.correction = correction
        self.position = position
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'original': self.original,
            'correction': self.correction,
            'position': self.position
        }


class SpellChecker:
    """Handles spell checking operations using TextBlob"""
    
    def __init__(self):
        logger.info("SpellChecker initialized")
    
    def check(self, text: str) -> tuple[str, List[SpellingError]]:
        """
        Check and correct spelling
        
        Args:
            text: Input text to check
            
        Returns:
            Tuple of (corrected_text, list of SpellingError objects)
        """
        try:
            blob = TextBlob(text)
            corrected_blob = blob.correct()
            corrected_text = str(corrected_blob)
            
            # Find spelling errors by comparing words
            errors = self._find_spelling_differences(text, corrected_text)
            
            logger.info(f"Spell check completed. Found {len(errors)} errors")
            return corrected_text, errors
            
        except Exception as e:
            logger.error(f"Error during spell checking: {str(e)}")
            raise
    
    def _find_spelling_differences(self, original: str, corrected: str) -> List[SpellingError]:
        """
        Find differences between original and corrected text
        
        Args:
            original: Original text
            corrected: Corrected text
            
        Returns:
            List of SpellingError objects
        """
        errors = []
        original_words = original.split()
        corrected_words = corrected.split()
        
        position = 0
        for orig_word, corr_word in zip(original_words, corrected_words):
            if orig_word != corr_word:
                errors.append(SpellingError(
                    original=orig_word,
                    correction=corr_word,
                    position=position
                ))
            position += len(orig_word) + 1  # +1 for space
        
        return errors