import React from 'react';
import Button from '@mui/material/Button';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import { useModalStore } from '../../store/modalStore';
import { useTableStore } from '../../store/tableStore';
import { dialogPaperStyles, useGlobalStore } from "../../store/globalStore";
import Box from "@mui/material/Box";
import DialogContent from "@mui/material/DialogContent";
import Grid from '@mui/material/Grid';
import TextField from "@mui/material/TextField";
import DialogActions from "@mui/material/DialogActions";
import ShareIcon from '@mui/icons-material/Share';
import Alert from '@mui/material/Alert';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from "@mui/material/IconButton";
import { supabase } from "../../lib/supabase";
import { ensureSession } from "../extras/ensureSession";
import { v4 as uuidv4 } from "uuid";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { Html5Qrcode } from "html5-qrcode";
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import OfflineAlert, { useIsOffline } from "../extras/OfflineAlert";

interface SharedUser {
    recordID: string;
    sharedToID: string;
    fullName: string | null;
}

export default function ShareBudget() {
    const open = useModalStore(s => s.shareBudget)
    const setOpen = useModalStore(s => s.setShareBudget)
    const offline = useIsOffline();
    const [shareToID, setShareToID] = React.useState('')
    const [errorText, setErrorText] = React.useState('')
    const setSnackText = useGlobalStore(s => s.setSnackBarText);
    const setSnackSev = useGlobalStore(s => s.setSnackBarSeverity);
    const setSnackOpen = useGlobalStore(s => s.setSnackBarOpen);
    const user = useGlobalStore(s => s.currentUser)
    const currentBudgetDetails = useTableStore(s => s.currentBudgetAndMonth)
    const theme = useTheme();
    const bigger = useMediaQuery(theme.breakpoints.up('sm'));
    const [scanning, setScanning] = React.useState(false);
    const scannerRef = React.useRef<Html5Qrcode | null>(null);
    const scannerContainerId = 'qr-reader';
    const [sharedUsers, setSharedUsers] = React.useState<SharedUser[]>([]);
    const [loadingShared, setLoadingShared] = React.useState(false);

    const startScanner = async () => {
        setScanning(true);
        // Small delay to let the DOM element render
        setTimeout(async () => {
            try {
                const html5QrCode = new Html5Qrcode(scannerContainerId);
                scannerRef.current = html5QrCode;
                await html5QrCode.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 200, height: 200 } },
                    (decodedText) => {
                        setShareToID(decodedText);
                        stopScanner();
                        setSnackSev('success');
                        setSnackText('QR Code scanned!');
                        setSnackOpen(true);
                    },
                    () => { } // ignore scan failures
                );
            } catch (err) {
                console.error('QR Scanner error:', err);
                setScanning(false);
                setErrorText('Could not access camera');
            }
        }, 100);
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (e) { /* ignore */ }
            scannerRef.current = null;
        }
        setScanning(false);
    };

    // Cleanup scanner when modal closes
    React.useEffect(() => {
        if (!open) {
            stopScanner();
            setShareToID('');
            setErrorText('');
            setSharedUsers([]);
        }
    }, [open]);

    // Fetch shared users when modal opens
    React.useEffect(() => {
        if (open && currentBudgetDetails?.budgetID) {
            fetchSharedUsers();
        }
    }, [open, currentBudgetDetails?.budgetID]);

    const fetchSharedUsers = async () => {
        setLoadingShared(true);
        await ensureSession();
        const { data, error } = await supabase
            .from('shared')
            .select('recordID, sharedToID')
            .eq('budgetID', currentBudgetDetails.budgetID);
        if (error) {
            console.error('fetchSharedUsers:', error.message);
            setLoadingShared(false);
            return;
        }
        if (!data || data.length === 0) {
            setSharedUsers([]);
            setLoadingShared(false);
            return;
        }
        // Fetch user names for the shared user IDs
        const userIDs = data.map((s: any) => s.sharedToID);
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('recordID, fullName')
            .in('recordID', userIDs);
        if (usersError) {
            console.error('fetchSharedUsers users:', usersError.message);
        }
        const userMap = new Map<string, string | null>();
        if (users) {
            users.forEach((u: any) => userMap.set(u.recordID, u.fullName));
        }
        setSharedUsers(data.map((s: any) => ({
            recordID: s.recordID,
            sharedToID: s.sharedToID,
            fullName: userMap.get(s.sharedToID) ?? null,
        })));
        setLoadingShared(false);
    };

    const handleUnshare = async (shareRecordID: string) => {
        await ensureSession();
        const { error } = await supabase
            .from('shared')
            .delete()
            .eq('recordID', shareRecordID);
        if (error) {
            setErrorText(error.message);
            return;
        }
        setSharedUsers(prev => prev.filter(s => s.recordID !== shareRecordID));
        setSnackSev('success');
        setSnackText('User removed from shared budget');
        setSnackOpen(true);
    };
    const handleSubmit = async (event: any) => {
        event.preventDefault();
        setErrorText('')
        if (shareToID === user.recordID) {
            setErrorText('you can\'t share a budget with yourself')
            return
        }
        if (shareToID === '') {
            setErrorText('please enter a user ID to share with')
            return
        }
        let newShare = {
            recordID: uuidv4(),
            budgetID: currentBudgetDetails.budgetID,
            sharedToID: shareToID
        }
        await ensureSession();
        let { error } = await supabase
            .from('shared')
            .insert(newShare)
        if (error) {
            setErrorText(error.message)
            return
        }
        setSnackSev('success')
        setSnackText('Budget Shared Successfully')
        setSnackOpen(true)
        setShareToID('')
        fetchSharedUsers()
    }
    return (
        <>
            <Dialog
                onClose={() => setOpen(false)}
                open={open}
                fullScreen={!bigger}
                slotProps={{ paper: bigger ? dialogPaperStyles : undefined }}
            >
                <Box sx={{ bgcolor: 'background.paper', height: '100%' }} component='form' onSubmit={handleSubmit}>
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        Share Budget<IconButton onClick={() => setOpen(false)}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Grid container spacing={2}>
                            <OfflineAlert />
                            <Grid size={12}>
                                <Alert severity="warning">Warning!! Sharing your budget allows the other user to create, view, edit and delete categories, sections, and transactions. You can remove the sharing from this budget in the future, but you cannot undo their actions.</Alert>
                            </Grid>
                            <Grid size={12}>
                                <Alert severity='info'>
                                    To share a budget, scan their QR code or enter their user ID.
                                    They can find their QR code in Settings → "Show My QR Code".
                                </Alert>
                            </Grid>
                            <Grid size={12}>
                                {scanning ? (
                                    <Box>
                                        <div id={scannerContainerId} style={{ width: '100%' }} />
                                        <Button fullWidth size='small' color='error' onClick={stopScanner} sx={{ mt: 1 }}>
                                            Stop Scanner
                                        </Button>
                                    </Box>
                                ) : (
                                    <Button
                                        fullWidth
                                        variant='outlined'
                                        startIcon={<QrCodeScannerIcon />}
                                        onClick={startScanner}
                                    >
                                        Scan QR Code
                                    </Button>
                                )}
                            </Grid>
                            <Grid size={12}>
                                <TextField
                                    autoFocus
                                    fullWidth
                                    value={shareToID}
                                    onChange={(event: any) => setShareToID(event.target.value)}
                                    type="text"
                                    label="User ID to share with"
                                />
                            </Grid>
                            <Grid size={12}>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                    Currently shared with
                                </Typography>
                                {loadingShared ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                                        <CircularProgress size={24} />
                                    </Box>
                                ) : sharedUsers.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                                        This budget is not shared with anyone yet.
                                    </Typography>
                                ) : (
                                    <List dense disablePadding>
                                        {sharedUsers.map((sharedUser) => (
                                            <ListItem
                                                key={sharedUser.recordID}
                                                secondaryAction={
                                                    <IconButton
                                                        edge="end"
                                                        aria-label="stop sharing"
                                                        color="error"
                                                        onClick={() => handleUnshare(sharedUser.recordID)}
                                                    >
                                                        <PersonRemoveIcon />
                                                    </IconButton>
                                                }
                                            >
                                                <ListItemText
                                                    primary={sharedUser.fullName || 'Unknown User'}
                                                    secondary={sharedUser.sharedToID}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                )}
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <Box sx={{ mx: 1, mt: 0.5 }}><Typography color='error'>{errorText}</Typography></Box>
                    <DialogActions>
                        <Button fullWidth startIcon={<ShareIcon />} type='submit' variant='contained' disabled={offline}>Share My Budget</Button>
                    </DialogActions>
                </Box>
            </Dialog>

        </>
    )
}
