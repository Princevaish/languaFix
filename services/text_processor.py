# services/text_processor.py
from typing import Dict, Any, List
from .spell_checker import SpellChecker, SpellingError
from .grammar_checker import GrammarChecker, GrammarError
from utils.metrics import TextMetrics
import logging


logger = logging.getLogger(__name__)


class TextProcessingResult:
    """Encapsulates text processing results"""
    
    def __init__(
        self,
        original_text: str,
        spell_corrected_text: str,
        grammar_corrected_text: str,
        spelling_errors: List[SpellingError],
        grammar_errors: List[GrammarError]
    ):
        self.original_text = original_text
        self.spell_corrected_text = spell_corrected_text
        self.grammar_corrected_text = grammar_corrected_text
        self.spelling_errors = spelling_errors
        self.grammar_errors = grammar_errors
        
        # Calculate metrics
        self.word_count = TextMetrics.calculate_word_count(original_text)
        self.character_count = TextMetrics.calculate_character_count(original_text)
        self.reading_time = TextMetrics.calculate_reading_time(original_text)
        
        # Calculate scores
        total_errors = len(spelling_errors) + len(grammar_errors)
        self.grammar_score = TextMetrics.calculate_grammar_score(
            self.word_count, 
            total_errors
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'original_text': self.original_text,
            'corrected_text': self.grammar_corrected_text,
            'spelling_errors': [e.to_dict() for e in self.spelling_errors],
            'grammar_errors': [e.to_dict() for e in self.grammar_errors],
            'statistics': {
                'word_count': self.word_count,
                'character_count': self.character_count,
                'reading_time': self.reading_time,
                'total_errors': len(self.spelling_errors) + len(self.grammar_errors),
                'spelling_error_count': len(self.spelling_errors),
                'grammar_error_count': len(self.grammar_errors),
                'grammar_score': self.grammar_score
            }
        }


class TextProcessor:
    """Main text processing service coordinating spell and grammar checking"""
    
    def __init__(self, language: str = 'en-US'):
        """
        Initialize TextProcessor
        
        Args:
            language: Language code for grammar checking
        """
        self.spell_checker = SpellChecker()
        self.grammar_checker = GrammarChecker(language=language)
        logger.info("TextProcessor initialized")
    
    def process(self, text: str) -> TextProcessingResult:
        """
        Process text for spelling and grammar errors
        
        Args:
            text: Input text to process
            
        Returns:
            TextProcessingResult object
        """
        try:
            # Spell check
            spell_corrected_text, spelling_errors = self.spell_checker.check(text)
            
            # Grammar check on spell-corrected text
            grammar_corrected_text, grammar_errors = self.grammar_checker.check(
                spell_corrected_text
            )
            
            result = TextProcessingResult(
                original_text=text,
                spell_corrected_text=spell_corrected_text,
                grammar_corrected_text=grammar_corrected_text,
                spelling_errors=spelling_errors,
                grammar_errors=grammar_errors
            )
            
            logger.info(
                f"Text processing completed. "
                f"Spelling errors: {len(spelling_errors)}, "
                f"Grammar errors: {len(grammar_errors)}"
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error during text processing: {str(e)}")
            raise
    
    def cleanup(self):
        """Cleanup resources"""
        self.grammar_checker.cleanup()