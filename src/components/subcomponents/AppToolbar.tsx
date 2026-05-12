import * as React from 'react';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import logo from '../../logo.png'
import { useGlobalStore } from "../../store/globalStore";
import IconButton from "@mui/material/IconButton";
import RefreshIcon from '@mui/icons-material/Refresh';

export default function AppToolbar() {
    const currentTheme = useGlobalStore(s => s.themeAtom);

    async function handleRefresh() {
        window.location.reload();
    }

    return (
        <>
            <AppBar position="fixed" elevation={1}
                sx={{ width: '100%', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
                <Toolbar variant='dense' sx={currentTheme === 'dark' ? null : { backgroundColor: 'background.paper', color: 'primary.main' }}>
                    <img
                        height='30'
                        src={logo}
                        srcSet={`${logo}?w=164&h=164&fit=crop&auto=format&dpr=2 2x`}
                        alt='logo'
                        loading="lazy"
                    />
                    <Typography variant="h6" sx={{ ml: 1, fontWeight: 100 }}>simple</Typography>
                    <Typography variant="h6" align="left" sx={{ flexGrow: 1 }}>
                        Budget
                    </Typography>
                    <IconButton
                        size='small'
                        onClick={handleRefresh}
                    >
                        <RefreshIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>
        </>
    );
}
