# services/grammar_checker.py
import language_tool_python
from typing import List, Dict, Any, Optional, Union
import logging
import atexit


logger = logging.getLogger(__name__)


class GrammarError:
    """Represents a grammar error"""
    
    def __init__(
        self,
        message: str,
        context: str,
        offset: int,
        length: int,
        replacements: List[str],
        rule_id: str,
        category: str
    ):
        self.message = message
        self.context = context
        self.offset = offset
        self.length = length
        self.replacements = replacements
        self.rule_id = rule_id
        self.category = category
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'message': self.message,
            'context': self.context,
            'offset': self.offset,
            'length': self.length,
            'replacements': self.replacements[:5],  # Limit to top 5 suggestions
            'rule_id': self.rule_id,
            'category': self.category
        }


class GrammarChecker:
    """Handles grammar checking operations using LanguageTool"""
    
    def __init__(self, language: str = 'en-US'):
        """
        Initialize GrammarChecker
        
        Args:
            language: Language code for LanguageTool
        """
        try:
            self.tool = language_tool_python.LanguageTool(language)
            logger.info(f"GrammarChecker initialized with language: {language}")
            
            # Register cleanup on exit
            atexit.register(self.cleanup)
        except Exception as e:
            logger.error(f"Failed to initialize LanguageTool: {str(e)}")
            raise
    
    def check(self, text: str) -> tuple[str, List[GrammarError]]:
        """
        Check and correct grammar
        
        Args:
            text: Input text to check
            
        Returns:
            Tuple of (corrected_text, list of GrammarError objects)
        """
        try:
            matches = self.tool.check(text)
            corrected_text = language_tool_python.utils.correct(text, matches)
            
            # Convert matches to GrammarError objects
            errors = self._convert_matches_to_errors(matches)
            
            logger.info(f"Grammar check completed. Found {len(errors)} errors")
            return corrected_text, errors
            
        except Exception as e:
            logger.error(f"Error during grammar checking: {str(e)}")
            raise
    
    def _convert_matches_to_errors(
        self, 
        matches: List[Any]
    ) -> List[GrammarError]:
        """
        Convert LanguageTool matches to GrammarError objects
        
        Uses defensive programming to handle both old and new Match object formats.
        Supports both snake_case (new) and camelCase (old) attribute names.
        
        Args:
            matches: List of Match objects from LanguageTool
            
        Returns:
            List of GrammarError objects
        """
        errors = []
        
        for match in matches:
            try:
                # Extract message (should be consistent across versions)
                message = self._safe_get_attr(match, ['message'], 'Unknown error')
                
                # Extract context (should be consistent across versions)
                context = self._safe_get_attr(match, ['context'], '')
                
                # Extract offset (should be consistent across versions)
                offset = self._safe_get_attr(match, ['offset'], 0)
                
                # Extract error length (try new name first, then old)
                length = self._safe_get_attr(
                    match, 
                    ['error_length', 'errorLength', 'length'], 
                    0
                )
                
                # Extract replacements (try new name first, then old)
                replacements_raw = self._safe_get_attr(
                    match, 
                    ['replacements'], 
                    []
                )
                
                # Ensure replacements is a list of strings
                replacements = self._normalize_replacements(replacements_raw)
                
                # Extract rule ID (try new name first, then old)
                rule_id = self._safe_get_attr(
                    match, 
                    ['rule_id', 'ruleId', 'rule'], 
                    'UNKNOWN'
                )
                
                # Extract category (try new name first, then old)
                category = self._safe_get_attr(
                    match, 
                    ['category'], 
                    'UNKNOWN'
                )
                
                # Ensure category is a string
                category = self._normalize_category(category)
                
                error = GrammarError(
                    message=str(message),
                    context=str(context),
                    offset=int(offset) if isinstance(offset, (int, float, str)) else 0,
                    length=int(length) if isinstance(length, (int, float, str)) else 0,
                    replacements=replacements,
                    rule_id=str(rule_id),
                    category=category
                )
                errors.append(error)
                
            except Exception as e:
                logger.warning(f"Failed to convert match to GrammarError: {str(e)}")
                # Continue processing other matches even if one fails
                continue
        
        return errors
    
    def _safe_get_attr(
        self, 
        obj: Any, 
        attr_names: List[str], 
        default: Any = None
    ) -> Any:
        """
        Safely get an attribute from an object, trying multiple possible names.
        
        Args:
            obj: Object to get attribute from
            attr_names: List of possible attribute names to try (in order)
            default: Default value if no attribute is found
            
        Returns:
            Attribute value or default
        """
        for attr_name in attr_names:
            value = getattr(obj, attr_name, None)
            if value is not None:
                return value
        return default
    
    def _normalize_replacements(self, replacements: Any) -> List[str]:
        """
        Normalize replacements to a list of strings.
        
        Args:
            replacements: Raw replacements value (could be list, tuple, or other)
            
        Returns:
            List of string replacements
        """
        if replacements is None:
            return []
        
        # If it's already a list or tuple, convert items to strings
        if isinstance(replacements, (list, tuple)):
            return [str(r) for r in replacements if r is not None]
        
        # If it's a single value, wrap it in a list
        if isinstance(replacements, str):
            return [replacements]
        
        # Try to iterate over it
        try:
            return [str(r) for r in replacements if r is not None]
        except (TypeError, AttributeError):
            logger.warning(f"Unexpected replacements type: {type(replacements)}")
            return []
    
    def _normalize_category(self, category: Any) -> str:
        """
        Normalize category to a string.
        
        Args:
            category: Raw category value (could be string, object, or other)
            
        Returns:
            String representation of category
        """
        if category is None:
            return 'UNKNOWN'
        
        # If it's already a string, return it
        if isinstance(category, str):
            return category
        
        # If it has a name attribute (enum-like), use that
        if hasattr(category, 'name'):
            return str(category.name)
        
        # If it has a value attribute (enum-like), use that
        if hasattr(category, 'value'):
            return str(category.value)
        
        # Otherwise, convert to string
        try:
            return str(category)
        except Exception as e:
            logger.warning(f"Failed to convert category to string: {str(e)}")
            return 'UNKNOWN'
    
    def cleanup(self):
        """Cleanup LanguageTool resources"""
        try:
            if hasattr(self, 'tool') and self.tool is not None:
                self.tool.close()
                logger.info("LanguageTool cleaned up successfully")
        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}")