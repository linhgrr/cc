import React from 'react';
import { buttonStyles, mergeButtonStyles } from '../../styles/buttonStyles';

const Button = ({ 
  variant = 'primary', 
  size = 'default',
  children, 
  className = '', 
  disabled = false,
  loading = false,
  icon,
  onClick,
  ...props 
}) => {
  // Determine base style based on variant
  const getBaseStyle = () => {
    switch (variant) {
      case 'primary':
        return size === 'fixed' ? buttonStyles.primaryFixed : buttonStyles.primary;
      case 'secondary':
        return size === 'fixed' ? buttonStyles.secondaryFixed : buttonStyles.secondary;
      case 'icon':
        return buttonStyles.icon;
      case 'iconSecondary':
        return buttonStyles.iconSecondary;
      case 'languageActive':
        return buttonStyles.languageActive;
      case 'languageInactive':
        return buttonStyles.languageInactive;
      case 'browse':
        return buttonStyles.browse;
      default:
        return buttonStyles.primary;
    }
  };

  const baseStyle = getBaseStyle();
  const disabledStyle = disabled ? 'opacity-50 cursor-not-allowed' : '';
  const finalClassName = mergeButtonStyles(baseStyle, `${disabledStyle} ${className}`);

  const handleClick = (e) => {
    if (disabled || loading) return;
    onClick?.(e);
  };

  return (
    <button
      className={finalClassName}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
          {children}
        </div>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button; 