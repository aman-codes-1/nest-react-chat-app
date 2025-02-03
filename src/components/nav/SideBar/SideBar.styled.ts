import { styled } from '@mui/system';

export const SideBarStyled = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  maxWidth: '400px',
  height: '100dvh',
  borderRight: `1px solid ${theme.palette.grey[300]}`,
  overflow: 'auto',
  '.flex-item:nth-last-of-type(1)': {
    paddingTop: '1rem',
  },
  [theme.breakpoints.down('lg')]: {
    maxWidth: '350px',
  },
  [theme.breakpoints.down('md')]: {
    maxWidth: '320px',
  },
  [theme.breakpoints.down('sm')]: {
    maxWidth: '100%',
    border: 'none',
    '.hidden-from-mobile': {
      display: 'none',
    },
  },
}));
