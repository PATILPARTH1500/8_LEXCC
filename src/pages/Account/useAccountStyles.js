import desktopStyles from './Account.module.css';
import mobileStyles from './Account.mobile.module.css';
import { useResponsive } from '../../contexts/ResponsiveContext';

export const useAccountStyles = () => {
  const { isMobile } = useResponsive();
  return isMobile ? mobileStyles : desktopStyles;
};
