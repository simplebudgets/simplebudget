import React from 'react';
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import { useNavigate } from "react-router-dom";
import { dialogPaperStyles, themes, useGlobalStore } from "../store/globalStore";
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from "@mui/material/CssBaseline";
import Grid from '@mui/material/Grid';
import Dialog from "@mui/material/Dialog";
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Alert from '@mui/material/Alert';
import Stack from "@mui/material/Stack";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import IconButton from '@mui/material/IconButton';
import logo from "../logo.png";
import {
    setCustomSupabaseConfig,
    resetToProductionSupabase,
    isCustomSupabaseConfig,
    isSelfHostedConfig,
} from "../lib/supabase";

export default function SupabaseConfigPage() {
    const navigate = useNavigate();
    const currentTheme = useGlobalStore(s => s.themeAtom);

    const existingConfig = localStorage.getItem('supabaseCustomConfig');
    const parsed = existingConfig ? JSON.parse(existingConfig) : null;

    const [mode, setMode] = React.useState<'production' | 'custom'>(
        isCustomSupabaseConfig() ? 'custom' : 'production'
    );
    const [url, setUrl] = React.useState(parsed?.url || '');
    const [apiKey, setApiKey] = React.useState(parsed?.key || '');
    const [saved, setSaved] = React.useState(false);
    const [error, setError] = React.useState('');

    const [actTheme, setTheme] = React.useState(themes.darkTheme);
    React.useEffect(() => {
        if (currentTheme === 'dark') {
            setTheme(themes.darkTheme);
        } else if (currentTheme === 'light') {
            setTheme(themes.lightTheme);
        }
    }, [currentTheme]);

    function handleSave() {
        setError('');
        setSaved(false);

        if (mode === 'production') {
            resetToProductionSupabase();
            setSaved(true);
            return;
        }

        // Validate custom inputs
        if (!url.trim()) {
            setError('Supabase URL is required.');
            return;
        }
        if (!apiKey.trim()) {
            setError('Supabase API Key is required.');
            return;
        }
        try {
            new URL(url.trim());
        } catch {
            setError('Please enter a valid URL.');
            return;
        }

        setCustomSupabaseConfig(url.trim(), apiKey.trim());
        setSaved(true);
    }

    return (
        <ThemeProvider theme={actTheme}>
            <CssBaseline />
            <Box sx={{
                width: '100%',
                height: '100vh',
                backgroundColor: 'primary.light',
            }} />
            <Dialog open={true} slotProps={{ paper: dialogPaperStyles }}>
                <Box sx={{
                    bgcolor: 'background.paper',
                    px: 3,
                    pb: 4,
                    pt: 3,
                    maxWidth: '360px',
                }}>
                    <Grid container rowSpacing={2}>
                        <Grid size={12}>
                            <Stack direction='row' alignItems='center' spacing={1}>
                                <IconButton
                                    aria-label="back to login"
                                    onClick={() => navigate('/login')}
                                    size="small"
                                >
                                    <ArrowBackIcon />
                                </IconButton>
                                <img
                                    height='36'
                                    src={logo}
                                    srcSet={`${logo}?w=164&h=164&fit=crop&auto=format&dpr=2 2x`}
                                    alt='logo'
                                    loading="lazy"
                                />
                                <Typography variant="h6">
                                    Backend Configuration
                                </Typography>
                            </Stack>
                        </Grid>

                        <Grid size={12}>
                            <Typography variant='body2' color='textSecondary'>
                                Choose the production backend or connect to your own Supabase instance.
                            </Typography>
                        </Grid>

                        {isSelfHostedConfig() && (
                            <Grid size={12}>
                                <Alert severity="info" variant="outlined">
                                    This instance has a pre-configured backend set by the host. You can still override it per-browser below.
                                </Alert>
                            </Grid>
                        )}

                        <Grid size={12}>
                            <FormControl>
                                <FormLabel id="backend-selection-label">Backend</FormLabel>
                                <RadioGroup
                                    aria-labelledby="backend-selection-label"
                                    value={mode}
                                    onChange={(e) => {
                                        setMode(e.target.value as 'production' | 'custom');
                                        setSaved(false);
                                        setError('');
                                    }}
                                >
                                    <FormControlLabel
                                        value="production"
                                        control={<Radio />}
                                        label="Production (default)"
                                    />
                                    <FormControlLabel
                                        value="custom"
                                        control={<Radio />}
                                        label="Custom Supabase instance"
                                    />
                                </RadioGroup>
                            </FormControl>
                        </Grid>

                        {mode === 'custom' && (
                            <>
                                <Grid size={12}>
                                    <TextField
                                        fullWidth
                                        label="Supabase URL"
                                        placeholder="https://your-project.supabase.co"
                                        value={url}
                                        onChange={(e) => { setUrl(e.target.value); setSaved(false); }}
                                    />
                                </Grid>
                                <Grid size={12}>
                                    <TextField
                                        fullWidth
                                        label="Supabase Anon Key"
                                        placeholder="your-anon-key-here"
                                        value={apiKey}
                                        onChange={(e) => { setApiKey(e.target.value); setSaved(false); }}
                                        multiline
                                        maxRows={3}
                                    />
                                </Grid>
                            </>
                        )}

                        {error && (
                            <Grid size={12}>
                                <Alert severity="error">{error}</Alert>
                            </Grid>
                        )}

                        {saved && (
                            <Grid size={12}>
                                <Alert severity="success">
                                    Configuration saved. Return to login to sign in.
                                </Alert>
                            </Grid>
                        )}

                        <Grid size={12}>
                            <Button
                                fullWidth
                                variant='contained'
                                onClick={handleSave}
                                sx={{ mt: 1 }}
                            >
                                Save Configuration
                            </Button>
                        </Grid>

                        <Grid size={12}>
                            <Button
                                fullWidth
                                size='small'
                                onClick={() => navigate('/login')}
                            >
                                Back to Login
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            </Dialog>
        </ThemeProvider>
    );
}
