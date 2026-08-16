import desktopStyles from './Auth.module.css';
import mobileStyles from './Auth.mobile.module.css';
import { useResponsive } from '../../contexts/ResponsiveContext';

export const useAuthStyles = () => {
  const { isMobile } = useResponsive();
  return isMobile ? mobileStyles : desktopStyles;
};
