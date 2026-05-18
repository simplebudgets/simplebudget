import React from 'react';
import TextField from "@mui/material/TextField";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import { useModalStore } from '../../store/modalStore';
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { dialogPaperStyles, useGlobalStore } from "../../store/globalStore";
import { useTableStore } from "../../store/tableStore";
import { v4 as uuidv4 } from "uuid";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import AddIcon from '@mui/icons-material/Add';
import { supabase } from "../../lib/supabase";
import { ensureSession } from "../extras/ensureSession";
import { withNetworkTimeout } from "../../lib/networkUtils";
import CloseIcon from '@mui/icons-material/Close';
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import OfflineAlert, { useIsOffline } from "../extras/OfflineAlert";
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

export default function AddSection() {
    const setLoadingOpen = useGlobalStore(s => s.setMainLoading)
    const offline = useIsOffline();
    const addNewSection = useModalStore(s => s.addSection);
    const setAddNewSection = useModalStore(s => s.setAddSection);
    const [sectionName, setSectionName] = React.useState('');
    const [sectionType, setSectionType] = React.useState('expense');
    const handleTypeChange = (
        event: React.MouseEvent<HTMLElement>,
        newType: string,
    ) => {
        if (newType !== null) {
            setSectionType(newType);
        }
    };
    const currentBudget = useTableStore(s => s.currentBudgetAndMonth)
    const sectionsArray = useTableStore(s => s.sections);
    const setSectionArray = useTableStore(s => s.setSections);
    const setSnackText = useGlobalStore(s => s.setSnackBarText);
    const setSnackSev = useGlobalStore(s => s.setSnackBarSeverity);
    const setSnackOpen = useGlobalStore(s => s.setSnackBarOpen);
    const [errorText, setErrorText] = React.useState('')
    const theme = useTheme();
    const bigger = useMediaQuery(theme.breakpoints.up('sm'));
    const verifyInputs = () => {
        if (sectionName === '' || sectionName === null) {
            setErrorText('Please enter section name.')
            return false
        }
        return true
    }
    async function handleSubmit(event: any) {
        event.preventDefault();
        if (currentBudget.budgetID === undefined) {
            setErrorText('You need to create a budget first! Go to the settings page, click \'Select Budget\'')
            return
        }
        setErrorText('')
        if (verifyInputs()) {
            setLoadingOpen(true)
            try {
                await withNetworkTimeout(ensureSession());
                let newSection = {
                    recordID: uuidv4(),
                    budgetID: currentBudget.budgetID,
                    sectionName: sectionName,
                    sectionType: sectionType,
                    sectionYear: currentBudget.year,
                    sectionMonth: currentBudget.month,
                };
                let { error } = await withNetworkTimeout(
                    Promise.resolve(supabase.from('sections').insert(newSection))
                ) as { error: any };
                if (error) {
                    setLoadingOpen(false)
                    setErrorText(error.message)
                    return
                }
                setSectionArray(prevState => [...prevState, newSection]);
                setAddNewSection(false)
                setLoadingOpen(false)
                setSnackSev('success')
                setSnackText('Section Added!')
                setSnackOpen(true)
            } catch (err: any) {
                setLoadingOpen(false)
                setErrorText(err.message || 'Network error — try again when online')
            }
        }
    }
    React.useEffect(() => {
        if (addNewSection) return;
        setSectionName('')
        setSectionType('expense')
        setErrorText('')
    }, [addNewSection])
    return (
        <>
            <Dialog open={addNewSection}
                onClose={() => setAddNewSection(false)}
                scroll='paper'
                fullScreen={!bigger}
                slotProps={{ paper: bigger ? dialogPaperStyles : undefined }}
            >
                <Box sx={{ bgcolor: 'background.paper', height: '100%' }} component='form' onSubmit={handleSubmit}>
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        New Section <IconButton onClick={() => setAddNewSection(false)}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Grid container spacing={2}>
                            <OfflineAlert />
                            <Grid size={12}>
                                <ToggleButtonGroup
                                    color={sectionType === 'income' ? 'success' : 'warning'}
                                    value={sectionType}
                                    fullWidth
                                    exclusive
                                    onChange={handleTypeChange}
                                >
                                    <ToggleButton value="income"><TrendingUpIcon sx={{ mr: 0.5 }} /> Income</ToggleButton>
                                    <ToggleButton value="expense"><TrendingDownIcon sx={{ mr: 0.5 }} /> Expense</ToggleButton>
                                </ToggleButtonGroup>
                            </Grid>
                            <Grid size={12}>
                                <TextField
                                    autoFocus
                                    fullWidth
                                    value={sectionName}
                                    onChange={(event: any) => setSectionName(event.target.value)}
                                    type="text"
                                    label="Section Name"
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <Box sx={{ mx: 1, mt: 0.5 }}><Typography color='error'>{errorText}</Typography></Box>
                    <DialogActions>
                        <Button fullWidth startIcon={<AddIcon />} type='submit' variant='contained' disabled={offline}>Add Section</Button>
                    </DialogActions>
                </Box>
            </Dialog>
        </>
    )
}
