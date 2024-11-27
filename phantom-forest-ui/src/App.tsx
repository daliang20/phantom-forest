import React from 'react';
import { Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import MobSearch from './components/MobSearch';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4CAF50',
    },
    secondary: {
      main: '#81C784',
    },
    background: {
      default: '#1A1A1A',
      paper: '#2D2D2D',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container>
        <MobSearch startMapId="610010004" />
      </Container>
    </ThemeProvider>
  );
}

export default App;
