import React from 'react';
import TextField from "@mui/material/TextField";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import { useModalStore } from '../../store/modalStore';
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import {
    dialogPaperStyles,
    useGlobalStore
} from "../../store/globalStore";
import { useTableStore } from "../../store/tableStore";
import SaveIcon from '@mui/icons-material/Save';
import { supabase } from "../../lib/supabase";
import { ensureSession } from "../extras/ensureSession";
import CloseIcon from '@mui/icons-material/Close';
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import Stack from "@mui/material/Stack";
import dayjs, { Dayjs } from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { supaCategories, supaSections } from "../extras/api_functions";
import { v4 as uuidv4 } from "uuid";
import OfflineAlert, { useIsOffline } from "../extras/OfflineAlert";

export default function CopyBudget() {
    const [fromMonth, setFromMonth] = React.useState<Dayjs | null>(dayjs());
    const [toMonth, setToMonth] = React.useState<Dayjs | null>(dayjs().add(1, 'month'));
    const offline = useIsOffline();
    const openCopyBudget = useModalStore(s => s.copyBudget)
    const setOpenCopyBudget = useModalStore(s => s.setCopyBudget)
    const currentBudget = useTableStore(s => s.currentBudgetAndMonth)
    const setSnackText = useGlobalStore(s => s.setSnackBarText);
    const setSnackSev = useGlobalStore(s => s.setSnackBarSeverity);
    const setSnackOpen = useGlobalStore(s => s.setSnackBarOpen);
    const [errorText, setErrorText] = React.useState('')
    const theme = useTheme();
    const bigger = useMediaQuery(theme.breakpoints.up('sm'));
    const setLoadingOpen = useGlobalStore(s => s.setMainLoading)

    const verifyInputs = () => {
        if (fromMonth === null) {
            setErrorText('Please enter a from month')
            return false
        }
        if (toMonth === null) {
            setErrorText('Please enter a to month')
            return false
        }
        if (dayjs(toMonth).format('MMMM, YYYY') === dayjs(fromMonth).format('MMMM, YYYY')) {
            setErrorText('Please select differing months')
            return false
        }
        return true
    }

    React.useEffect(() => {
        if (openCopyBudget) {
            setErrorText('')
        }
    }, [openCopyBudget])

    async function handleSubmit(event: any) {
        event.preventDefault();
        setErrorText('')
        setLoadingOpen(true)
        await ensureSession();
        if (verifyInputs()) {

            let allSections = await supaSections(currentBudget.budgetID, dayjs(fromMonth).format('MMMM'), Number(dayjs(fromMonth).format('YYYY')))
            if (allSections === null) {
                setErrorText('no sections found for the from month')
                setSnackSev('error')
                setSnackText('No data found')
                setSnackOpen(true)
                return
            }

            let newSectionArray = allSections.map((x) => ({
                recordID: uuidv4(),
                budgetID: currentBudget.budgetID,
                sectionName: x.sectionName,
                sectionType: x.sectionType,
                sectionYear: Number(dayjs(toMonth).format('YYYY')),
                sectionMonth: dayjs(toMonth).format('MMMM'),
            }))
            for (let i = 0; i < newSectionArray.length; i++) {
                let { error } = await supabase
                    .from('sections')
                    .insert(newSectionArray[i])
                if (error) {
                    setErrorText(error.message)
                    return
                }
            }

            let allCategories = await supaCategories(allSections.map(x => x.recordID))
            if (allCategories !== null) {
                let newCategories = allCategories.map((row) => ({
                    recordID: uuidv4(),
                    //@ts-ignore
                    sectionID: newSectionArray[allSections.findIndex(x => x.recordID === row.sectionID)].recordID,
                    categoryName: row.categoryName,
                    amount: row.amount
                }))
                for (let i = 0; i < newCategories.length; i++) {
                    let { error } = await supabase
                        .from('categories')
                        .insert(newCategories[i])
                    if (error) {
                        setErrorText(error.message)
                        return
                    }
                }
            }
            setLoadingOpen(false)
            setOpenCopyBudget(false)
            setSnackSev('success')
            setSnackText('Budget data copied!')
            setSnackOpen(true)
        }
    }
    return (
        <>
            <Dialog open={openCopyBudget}
                onClose={() => setOpenCopyBudget(false)}
                scroll='paper'
                fullScreen={!bigger}
                slotProps={{ paper: bigger ? dialogPaperStyles : undefined }}
            >
                <Box sx={{ bgcolor: 'background.paper', height: '100%' }} component='form' onSubmit={handleSubmit}>
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Stack direction='row' alignItems='center' spacing={1}>
                            <div>Copy Budget Outline</div>
                        </Stack>
                        <IconButton onClick={() => setOpenCopyBudget(false)}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Grid container spacing={2}>
                            <OfflineAlert />
                            <Typography>This will copy all sections and categories from one month to another. </Typography>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <Grid size={12}>
                                    <DatePicker
                                        views={['year', 'month']}
                                        label="Copy From"
                                        minDate={dayjs().subtract(2, 'year')}
                                        maxDate={dayjs().add(2, 'year')}
                                        value={fromMonth}
                                        onChange={(newValue) => {
                                            setFromMonth(newValue);
                                        }}
                                        slotProps={{
                                            textField: (params) => <TextField {...params} fullWidth helperText={null} />,
                                        }}
                                        sx={{ width: '100%' }}
                                    />
                                </Grid>
                                <Grid size={12}>
                                    <DatePicker
                                        views={['year', 'month']}
                                        label="Copy To"
                                        value={toMonth}
                                        minDate={dayjs().subtract(2, 'year')}
                                        maxDate={dayjs().add(2, 'year')}
                                        onChange={(newValue) => {
                                            setToMonth(newValue);
                                        }}
                                        slotProps={{
                                            textField: (params) => <TextField {...params} fullWidth helperText={null} />,
                                        }}
                                        sx={{ width: '100%' }}
                                    />
                                </Grid>
                            </LocalizationProvider>
                        </Grid>
                    </DialogContent>
                    <Box sx={{ mx: 1, mt: 0.5 }}><Typography color='error'>{errorText}</Typography></Box>
                    <DialogActions>
                        <Button fullWidth startIcon={<SaveIcon />} variant='contained' type='submit' disabled={offline}>Copy Data</Button>
                    </DialogActions>
                </Box>
            </Dialog>
        </>
    )
}
