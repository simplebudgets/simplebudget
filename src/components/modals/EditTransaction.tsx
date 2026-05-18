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
import dayjs, { Dayjs } from "dayjs";
import { useTableStore } from "../../store/tableStore";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import Autocomplete from '@mui/material/Autocomplete';
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import InputAdornment from "@mui/material/InputAdornment";
import { supabase } from "../../lib/supabase";
import { ensureSession } from "../extras/ensureSession";
import { withNetworkTimeout } from "../../lib/networkUtils";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from '@mui/icons-material/Close';
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import Stack from "@mui/material/Stack";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import MenuItem from "@mui/material/MenuItem";
import DeleteIcon from "@mui/icons-material/Delete";
import Menu from "@mui/material/Menu";
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { styled, lighten, darken } from '@mui/system';
import OfflineAlert, { useIsOffline } from "../extras/OfflineAlert";

const GroupHeader = styled('div')(({ theme }) => ({
    position: 'sticky',
    top: '-8px',
    padding: '4px 10px',
    color: theme.palette.primary.main,
    backgroundColor:
        theme.palette.mode === 'light'
            ? lighten(theme.palette.primary.light, 0.85)
            : darken(theme.palette.primary.main, 0.8),
}));

const GroupItems = styled('ul')({
    padding: 0,
});

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

export default function EditTransaction() {
    const setLoadingOpen = useGlobalStore(s => s.setMainLoading)
    const offline = useIsOffline();
    const openEditTransaction = useModalStore(s => s.editTransaction);
    const setOpenEditTransaction = useModalStore(s => s.setEditTransaction);
    const currentTransactionID = useModalStore(s => s.currentTransaction)
    const transactionsArray = useTableStore(s => s.transactions)
    const setTransactionsArray = useTableStore(s => s.setTransactions)
    const setSnackText = useGlobalStore(s => s.setSnackBarText);
    const setSnackSev = useGlobalStore(s => s.setSnackBarSeverity);
    const setSnackOpen = useGlobalStore(s => s.setSnackBarOpen);
    const [errorText, setErrorText] = React.useState('')
    const currentTransactionDetails = transactionsArray.find(x => x.recordID === currentTransactionID)
    const [transactionAmount, setTransactionAmount] = React.useState(0.00)
    const [transactionTitle, setTransactionTitle] = React.useState('')
    const [transactionCategory, setTransactionCategory] = React.useState<any>(null);
    const [transactionType, setTransactionType] = React.useState('expense')
    const [transactionDate, setTransactionDate] = React.useState<Dayjs | null>(dayjs())
    const areYouSureOpen = useModalStore(s => s.areYouSure);
    const setAreYouSureOpen = useModalStore(s => s.setAreYouSure);
    const setCheckTitle = useGlobalStore(s => s.setAreYouSureTitle);
    const setCheckDetails = useGlobalStore(s => s.setAreYouSureDetails);
    const checkAccept = useGlobalStore(s => s.areYouSureAccept);
    const setCheckAccept = useGlobalStore(s => s.setAreYouSureAccept);
    const [deleteTrans, setDeleteTrans] = React.useState(false)
    const theme = useTheme();
    const bigger = useMediaQuery(theme.breakpoints.up('sm'));
    const handleTypeChange = (
        event: React.MouseEvent<HTMLElement>,
        newType: string,
    ) => {
        if (newType !== null) {
            setTransactionType(newType);
        }
    };
    const categoriesArray = useTableStore(s => s.categories)
    const sectionsArray = useTableStore(s => s.sections)
    const transactionsArr = useTableStore(s => s.transactions)
    const categoryGroups = categoriesArray.map((option) => {
        const section = sectionsArray.find(x => x.recordID === option.sectionID)
        const sectionName = section?.sectionName ?? ""
        const expenses = transactionsArr.filter(x => x.categoryID === option.recordID && x.transactionType === "expense").reduce((a, o) => a + o.amount, 0)
        const incomes = transactionsArr.filter(x => x.categoryID === option.recordID && x.transactionType === "income").reduce((a, o) => a + o.amount, 0)
        const tracked = Math.round((incomes - expenses + Number.EPSILON) * 100) / 100
        const remaining = option.amount + tracked
        return {
            sectionName,
            id: option.recordID,
            label: option.categoryName,
            remaining: Math.round(remaining * 100) / 100,
        };
    }).sort(function (a, b) {
        if (a.sectionName < b.sectionName) { return -1; }
        if (a.sectionName > b.sectionName) { return 1; }
        return 0;
    }
    );
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const moreOpen = Boolean(anchorEl);
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    async function handleDoubleCheck() {
        setDeleteTrans(true)
        setAnchorEl(null);
        let transDetails = 'Title: '
        if (currentTransactionDetails !== undefined) {
            transDetails = transDetails + currentTransactionDetails.title
        }
        setCheckTitle('Are you sure you want to delete this transaction?')
        setCheckDetails(transDetails)
        setAreYouSureOpen(true)
    }

    React.useEffect(() => {
        if (!areYouSureOpen) {
            if (checkAccept) {
                handleDelete()
            }
            setDeleteTrans(false)
        }
    }, [areYouSureOpen])

    async function handleDelete() {
        setErrorText('')
        if (!deleteTrans) {
            return
        }
        setLoadingOpen(true)
        try {
            await withNetworkTimeout(ensureSession());
            let { error } = await withNetworkTimeout(
                Promise.resolve(supabase.from('transactions').delete().eq('recordID', currentTransactionID))
            ) as { error: any };
            if (error) {
                setLoadingOpen(false)
                setErrorText(error.message)
                return
            }
            let newArr = transactionsArray.filter(function (el) { return el.recordID !== currentTransactionID; });
            setTransactionsArray(newArr);
            setOpenEditTransaction(false)
            setLoadingOpen(false)
            setSnackSev('success')
            setSnackText('Transaction deleted')
            setSnackOpen(true)
            setCheckAccept(false)
            setDeleteTrans(false)
        } catch (err: any) {
            setLoadingOpen(false)
            setErrorText(err.message || 'Network error — try again when online')
        }
    }
    const verifyInputs = () => {
        if (transactionTitle === '' || transactionTitle === null) {
            setErrorText('Please enter a title')
            return false
        }
        if (transactionDate === null) {
            setErrorText('Please enter a date')
            return false
        }
        return true
    }
    async function handleSubmit(event: any) {
        event.preventDefault();
        setErrorText('')
        console.log(transactionCategory)
        if (verifyInputs()) {
            setLoadingOpen(true)
            try {
                await withNetworkTimeout(ensureSession());
                let { error } = await withNetworkTimeout(
                    Promise.resolve(supabase.from('transactions').update({
                        categoryID: transactionCategory === null ? null : transactionCategory.id,
                        //@ts-ignore
                        amount: transactionAmount === '' ? 0 : transactionAmount,
                        title: transactionTitle,
                        transactionDate: dayjs(transactionDate).valueOf() !== null ? dayjs(transactionDate).valueOf() : dayjs().valueOf(),
                        transactionType: transactionType,
                    }).eq('recordID', currentTransactionID))
                ) as { error: any };
                if (error) {
                    setErrorText(error.message)
                    setLoadingOpen(false)
                    return
                }
                let newArr = transactionsArray.map(obj => {
                    if (obj.recordID === currentTransactionID) {
                        return {
                            ...obj,
                            categoryID: transactionCategory === null ? null : transactionCategory.id,
                            //@ts-ignore
                            amount: transactionAmount === '' ? 0 : transactionAmount,
                            title: transactionTitle,
                            transactionDate: dayjs(transactionDate).valueOf() !== null ? dayjs(transactionDate).valueOf() : 0,
                            transactionType: transactionType,
                        };
                    }
                    return obj;
                });
                setTransactionsArray(newArr);
                setOpenEditTransaction(false)
                setLoadingOpen(false)
                setSnackSev('success')
                setSnackText('Transaction updated!')
                setSnackOpen(true)
            } catch (err: any) {
                setLoadingOpen(false)
                setErrorText(err.message || 'Network error — try again when online')
            }
        }
    }
    const handleFocus = (event: any) => {
        if (event) {
            event.target.select()
        }
    };
    React.useEffect(() => {
        if (!openEditTransaction) return;
        if (currentTransactionDetails) {
            setTransactionTitle(currentTransactionDetails.title)
            setTransactionAmount(currentTransactionDetails.amount)
            setTransactionType(currentTransactionDetails.transactionType)
            setTransactionCategory(categoryGroups.find(x => x.id === currentTransactionDetails.categoryID))
            setTransactionDate(dayjs(currentTransactionDetails.transactionDate))
        }
        setErrorText('')
    }, [openEditTransaction])
    return (
        <>
            <Dialog open={openEditTransaction}
                onClose={() => setOpenEditTransaction(false)}
                scroll='paper'
                fullScreen={!bigger}
                slotProps={{ paper: bigger ? dialogPaperStyles : undefined }}
            >
                <Box sx={{ bgcolor: 'background.paper', height: '100%' }} component='form' onSubmit={handleSubmit}>
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Stack direction='row' alignItems='center' spacing={1}>
                            <IconButton
                                size='small'
                                aria-label="more"
                                aria-controls={moreOpen ? 'long-menu' : undefined}
                                aria-expanded={moreOpen ? 'true' : undefined}
                                aria-haspopup="true"
                                onClick={handleClick}
                            >
                                <MoreVertIcon />
                            </IconButton>
                            <div>Edit Transaction</div>
                        </Stack>
                        <IconButton onClick={() => setOpenEditTransaction(false)}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Grid container spacing={2}>
                            <OfflineAlert />
                            <Grid size={12}>
                                <ToggleButtonGroup
                                    color={transactionType === 'income' ? 'success' : 'warning'}
                                    value={transactionType}
                                    fullWidth
                                    onFocus={handleFocus}
                                    exclusive
                                    onChange={handleTypeChange}
                                    size='small'
                                >
                                    <ToggleButton value="income"><TrendingUpIcon sx={{ mr: 0.5 }} />Income</ToggleButton>
                                    <ToggleButton value="expense"><TrendingDownIcon sx={{ mr: 0.5 }} />Expense</ToggleButton>
                                </ToggleButtonGroup>
                            </Grid>
                            <Grid size={{ xs: 6, md: 12 }}>
                                <TextField
                                    autoFocus
                                    onFocus={handleFocus}
                                    fullWidth
                                    value={transactionAmount}
                                    onChange={(event: any) => setTransactionAmount(event.target.value)}
                                    type="number"
                                    slotProps={{
                                        input: {
                                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                        },
                                        htmlInput: { step: '.01' },
                                    }}
                                    placeholder='Amount'
                                    label="Amount"
                                />
                            </Grid>
                            <Grid size={{ xs: 6, md: 12 }}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        closeOnSelect
                                        label="Date"
                                        value={transactionDate}
                                        onChange={(newValue) => {
                                            setTransactionDate(newValue);
                                        }}
                                        slotProps={{
                                            actionBar: { actions: ['today'] },
                                            textField: (params) => <TextField {...params} onFocus={handleFocus} fullWidth />,
                                        }}
                                        sx={{ width: '100%' }}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid size={12}>
                                <TextField
                                    fullWidth
                                    onFocus={handleFocus}
                                    value={transactionTitle}
                                    onChange={(event: any) => setTransactionTitle(event.target.value)}
                                    type="text"
                                    label="Title"
                                />
                            </Grid>
                            <Grid size={12}>
                                <Autocomplete
                                    disablePortal={false}
                                    options={categoryGroups}
                                    getOptionLabel={(option) => option.label}
                                    groupBy={(option) => option.sectionName}
                                    fullWidth
                                    value={transactionCategory}
                                    onChange={(event: any, newValue: any) => {
                                        setTransactionCategory(newValue)
                                    }}
                                    renderInput={(params) => <TextField onFocus={handleFocus} margin="none" {...params} label="Category" />}
                                    renderOption={(props, option) => (
                                        <li {...props} key={option.id}>
                                            <Box display='flex' justifyContent='space-between' width='100%'>
                                                <span>{option.label}</span>
                                                <Typography variant='body2' color='text.secondary'>{formatter.format(option.remaining)}</Typography>
                                            </Box>
                                        </li>
                                    )}
                                    renderGroup={(params) => (
                                        <li>
                                            <GroupHeader>{params.group}</GroupHeader>
                                            <GroupItems>{params.children}</GroupItems>
                                        </li>
                                    )}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <Box sx={{ mx: 1, mt: 0.5 }}><Typography color='error'>{errorText}</Typography></Box>
                    <DialogActions>
                        <Button fullWidth startIcon={<SaveIcon />} variant='contained' type='submit' disabled={offline}>Save Changes</Button>
                    </DialogActions>
                </Box>
            </Dialog>
            <Menu
                id="long-menu"
                slotProps={{
                    list: {
                        'aria-labelledby': 'long-button',
                    },
                }}
                anchorEl={anchorEl}
                open={moreOpen}
                onClose={handleClose}
            >
                <MenuItem onClick={handleDoubleCheck} disabled={offline}>
                    <DeleteIcon />
                    Delete
                </MenuItem>
            </Menu>
        </>
    )
}
