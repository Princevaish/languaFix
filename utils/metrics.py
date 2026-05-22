# utils/metrics.py
from typing import Dict, Any
import math


class TextMetrics:
    """Calculate text metrics and statistics"""
    
    WORDS_PER_MINUTE = 200  # Average reading speed
    
    @staticmethod
    def calculate_word_count(text: str) -> int:
        """Calculate word count"""
        return len(text.split())
    
    @staticmethod
    def calculate_character_count(text: str, include_spaces: bool = True) -> int:
        """Calculate character count"""
        if include_spaces:
            return len(text)
        return len(text.replace(' ', ''))
    
    @staticmethod
    def calculate_reading_time(text: str) -> Dict[str, int]:
        """
        Calculate estimated reading time
        
        Returns:
            Dict with 'minutes' and 'seconds'
        """
        word_count = TextMetrics.calculate_word_count(text)
        total_seconds = (word_count / TextMetrics.WORDS_PER_MINUTE) * 60
        minutes = math.floor(total_seconds / 60)
        seconds = math.floor(total_seconds % 60)
        
        return {
            'minutes': minutes,
            'seconds': seconds,
            'total_seconds': int(total_seconds)
        }
    
    @staticmethod
    def calculate_grammar_score(total_words: int, error_count: int) -> float:
        """
        Calculate grammar score (0-100)
        
        Args:
            total_words: Total number of words
            error_count: Number of errors detected
            
        Returns:
            Score between 0 and 100
        """
        if total_words == 0:
            return 100.0
        
        # Penalize based on error density
        error_rate = error_count / total_words
        score = max(0, 100 - (error_rate * 1000))
        
        return round(score, 2)