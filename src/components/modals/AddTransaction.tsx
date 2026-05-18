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
import { dialogPaperStyles, useGlobalStore } from "../../store/globalStore";
import { v4 as uuidv4 } from "uuid";
import dayjs, { Dayjs } from "dayjs";
import { useTableStore } from "../../store/tableStore";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import Autocomplete from '@mui/material/Autocomplete';
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import InputAdornment from "@mui/material/InputAdornment";
import AddIcon from "@mui/icons-material/Add";
import { insertTransactionWithOfflineSupport } from "../../lib/offlineSync";
import CloseIcon from '@mui/icons-material/Close';
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { styled, lighten, darken } from '@mui/system';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import Alert from '@mui/material/Alert';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import ReadMoreOutlinedIcon from '@mui/icons-material/ReadMoreOutlined';

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

export default function AddTransaction() {
    const setLoadingOpen = useGlobalStore(s => s.setMainLoading)
    const [splitBool, setSplitBool] = React.useState(false);
    const addNewTransaction = useModalStore(s => s.addTransaction);
    const setAddNewTransaction = useModalStore(s => s.setAddTransaction);
    const [transactionAmount, setTransactionAmount] = React.useState(0.00)
    const [transactionTitle, setTransactionTitle] = React.useState('')
    const transactionCategory = useGlobalStore(s => s.addTransactionCategory);
    const setTransactionCategory = useGlobalStore(s => s.setAddTransactionCategory);
    const transactionType = useGlobalStore(s => s.addTransactionType);
    const setTransactionType = useGlobalStore(s => s.setAddTransactionType);

    let splitArrDef = [
        {
            recId: uuidv4(),
            cat: transactionCategory,
            transAmount: transactionAmount,
        }
    ]
    const [splitArr, setSplitArr] = React.useState(splitArrDef);
    const [transactionDate, setTransactionDate] = React.useState<Dayjs | null>(dayjs())
    const handleTypeChange = (
        event: React.MouseEvent<HTMLElement>,
        newType: string,
    ) => {
        if (newType !== null) {
            //@ts-ignore
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
        const remaining = section?.sectionType === 'income'
            ? option.amount + tracked
            : option.amount + tracked
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
    const setTransactionsArray = useTableStore(s => s.setTransactions)
    const setSnackText = useGlobalStore(s => s.setSnackBarText);
    const setSnackSev = useGlobalStore(s => s.setSnackBarSeverity);
    const setSnackOpen = useGlobalStore(s => s.setSnackBarOpen);
    const currentBudget = useTableStore(s => s.currentBudgetAndMonth)
    const currentUserData = useGlobalStore(s => s.currentUser)
    const [errorText, setErrorText] = React.useState('')
    const theme = useTheme();
    const bigger = useMediaQuery(theme.breakpoints.up('sm'));
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
        if (currentBudget.budgetID === undefined) {
            setErrorText('You need to create a budget first! Go to the settings page, click \'Select Budget\'')
            return
        }
        setErrorText('')
        if (!verifyInputs()) {
            return
        }
        setLoadingOpen(true)
        // Session refresh happens in the background sync — no need to block here
        if (splitBool) {
            const splitTotal = splitArr.reduce((acc, obj) => acc + Number(obj.transAmount), 0);
            if (Math.abs(Number(transactionAmount) - splitTotal) > 0.01) {
                setErrorText('Must allocate full amount!')
                setLoadingOpen(false)
                return
            }

            // Validate all splits have a category selected
            if (splitArr.some(row => row.cat === null || row.cat === undefined)) {
                setErrorText('Please select a category for each split')
                setLoadingOpen(false)
                return
            }

            let addTransactions = splitArr.map((row) => {
                return {
                    recordID: row.recId,
                    budgetID: currentBudget.budgetID,
                    categoryID: row.cat.id,
                    amount: Math.round(Number(row.transAmount) * 100) / 100,
                    title: transactionTitle + ' ' + transactionAmount + ' split',
                    transactionDate: dayjs(transactionDate).valueOf() !== null ? dayjs(transactionDate).valueOf() : dayjs().valueOf(),
                    transactionType: transactionType,
                    creatorID: currentUserData.recordID,
                }
            })

            try {
                for (const x of addTransactions) {
                    const result = await insertTransactionWithOfflineSupport(x);
                    if (!result.success) {
                        setErrorText(result.error || 'Failed to save transaction')
                        setLoadingOpen(false)
                        return
                    }
                    setTransactionsArray((prevState: any[]) => [...prevState, x]);
                }
                setAddNewTransaction(false)
                setLoadingOpen(false)
                setSnackSev('success')
                setSnackText(navigator.onLine ? 'Transactions Added!' : 'Transactions saved offline — will sync when online!')
                setSnackOpen(true)
            } catch (err: any) {
                setErrorText(err.message || 'Failed to save split transactions')
                setLoadingOpen(false)
                return
            }
            return
        } //the typical un-split transaction
        let newTransaction = {
            recordID: uuidv4(),
            budgetID: currentBudget.budgetID,
            //@ts-ignore
            categoryID: transactionCategory === null ? null : transactionCategory.id,
            //@ts-ignore
            amount: transactionAmount === '' ? 0 : Math.round(transactionAmount * 100) / 100,
            title: transactionTitle,
            transactionDate: dayjs(transactionDate).valueOf() !== null ? dayjs(transactionDate).valueOf() : dayjs().valueOf(),
            transactionType: transactionType,
            creatorID: currentUserData.recordID,
        };
        const result = await insertTransactionWithOfflineSupport(newTransaction);
        if (!result.success) {
            setErrorText(result.error || 'Failed to save transaction')
            setLoadingOpen(false)
            return
        }
        //@ts-ignore
        setTransactionsArray(prevState => [...prevState, newTransaction]);
        setAddNewTransaction(false)
        setLoadingOpen(false)
        setSnackSev('success')
        setSnackText(navigator.onLine ? 'Transaction Added!' : 'Transaction saved offline — will sync when online!')
        setSnackOpen(true)
    }
    function addSplit() {
        let newCat = {
            recId: uuidv4(),
            cat: null,
            transAmount: 0,
        }
        setSplitArr(prevState => [...prevState, newCat]);
    }
    function deleteSplitCat(splitRecId: any) {
        setSplitArr(splitArr.filter(function (el) { return el.recId !== splitRecId; }));
    }
    function changeSplitAmount(splitRecId: string, newVal: any) {
        let newArr = splitArr.map(obj => {
            if (obj.recId === splitRecId) {
                return { ...obj, transAmount: newVal }
            }
            return obj;
        })
        //@ts-ignore
        setSplitArr(newArr);
    }
    function changeSplitCat(splitRecId: string, newVal: any) {
        let newArr = splitArr.map(obj => {
            if (obj.recId === splitRecId) {
                return { ...obj, cat: newVal }
            }
            return obj;
        })
        //@ts-ignore
        setSplitArr(newArr);
    }
    function allocateRest(splitRecId: string) {
        const otherTotal = splitArr
            .filter(obj => obj.recId !== splitRecId)
            .reduce((acc, obj) => acc + Number(obj.transAmount), 0);
        const remaining = Math.round((Number(transactionAmount) - otherTotal) * 100) / 100;
        changeSplitAmount(splitRecId, remaining > 0 ? remaining : 0);
    }
    const handleFocus = (event: any) => {
        if (event) {
            event.target.select()
        }
    };
    React.useEffect(() => {
        if (addNewTransaction) {
            // Set defaults when modal opens
            if (transactionType === null) {
                setTransactionType('expense')
            }
            return;
        }
        setTransactionTitle('')
        setTransactionAmount(0)
        setTransactionType('expense')
        setTransactionCategory(null)
        setTransactionDate(dayjs())
        setSplitBool(false)
        setSplitArr(splitArrDef)
        setErrorText('')
    }, [addNewTransaction])
    React.useEffect(() => {
        if (!splitBool) return;
        //@ts-ignore
        setTransactionType('expense')
        //@ts-ignore
        setSplitArr(splitArr.map(obj => {
            return { ...obj, cat: transactionCategory }
        }))
    }, [splitBool])
    return (
        <>
            <Dialog open={addNewTransaction}
                onClose={() => setAddNewTransaction(false)}
                scroll='paper'
                fullScreen={!bigger}
                slotProps={{ paper: bigger ? dialogPaperStyles : undefined }}
            >
                <Box sx={{ bgcolor: 'background.paper', height: '100%' }} component='form' onSubmit={handleSubmit}>
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        New Transaction
                        <ToggleButton
                            value="check"
                            selected={splitBool}
                            size='medium'
                            color="error"
                            onChange={() => {
                                setSplitBool(!splitBool);
                            }}>
                            <AltRouteIcon />
                            Split
                        </ToggleButton>
                        <IconButton onClick={() => setAddNewTransaction(false)}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Grid container spacing={2}>
                            {currentBudget.month !== dayjs().format('MMMM') || currentBudget.year !== Number(dayjs().format('YYYY')) ? (
                                <Grid size={12}>
                                    <Alert severity="warning" variant="outlined" sx={{ py: 0 }}>
                                        You're adding to {currentBudget.month} {currentBudget.year}
                                    </Alert>
                                </Grid>
                            ) : null}
                            {splitBool ?
                                <>
                                    <Grid size={12}><Typography variant='subtitle2'>{"Left to track: " + formatter.format(transactionAmount - splitArr.reduce((accumulator, object) => {
                                        return accumulator + Number(object.transAmount);
                                    }, 0))}</Typography></Grid>
                                </>
                                :
                                <Grid size={12}>
                                    <ToggleButtonGroup
                                        color={transactionType === 'income' ? 'success' : 'warning'}
                                        value={transactionType}
                                        fullWidth
                                        exclusive
                                        onChange={handleTypeChange}
                                        size='small'
                                    >
                                        <ToggleButton value="income"><TrendingUpIcon sx={{ mr: 0.5 }} />Income</ToggleButton>
                                        <ToggleButton value="expense"><TrendingDownIcon sx={{ mr: 0.5 }} />Expense</ToggleButton>
                                    </ToggleButtonGroup>
                                </Grid>
                            }
                            <Grid size={{ xs: 6, md: 12 }}>
                                <TextField
                                    onFocus={handleFocus}
                                    fullWidth
                                    autoFocus
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
                                    label={splitBool ? "Total Amount" : "Amount"}
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
                                            textField: (params) => <TextField onFocus={handleFocus} {...params} fullWidth />,
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
                                    label={splitBool ? "Overall Title" : "Title"}
                                    required
                                />
                            </Grid>
                            {splitBool ?
                                <></>
                                :
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
                            }
                            {splitBool ?
                                <Grid container spacing={1}>
                                    {splitArr.map((x) => (
                                        <>
                                            <Grid size={3.5} key={x.recId}>
                                                <TextField
                                                    onFocus={handleFocus}
                                                    fullWidth
                                                    autoFocus
                                                    size='small'
                                                    value={x.transAmount}
                                                    onChange={(event: any) => changeSplitAmount(x.recId, event.target.value)}
                                                    type="number"
                                                    slotProps={{
                                                        input: {
                                                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                                        },
                                                        htmlInput: { step: '.01' }
                                                    }}
                                                    placeholder='Amount'
                                                    label="Amount"
                                                    variant='filled'
                                                    required
                                                />
                                            </Grid>
                                            <Grid size={6.5}>
                                                <Autocomplete
                                                    disablePortal={false}
                                                    options={categoryGroups}
                                                    getOptionLabel={(option) => option.label}
                                                    groupBy={(option) => option.sectionName}
                                                    fullWidth
                                                    size='small'
                                                    value={x.cat}
                                                    onChange={(event: any, newValue: any) => {
                                                        changeSplitCat(x.recId, newValue)
                                                    }}
                                                    renderInput={(params) => <TextField variant='filled' required onFocus={handleFocus} margin="none" {...params} label="Category" />}
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
                                            <Grid size={1}>
                                                <IconButton size='small' title='Allocate rest' onClick={() => allocateRest(x.recId)}><ReadMoreOutlinedIcon /></IconButton>
                                            </Grid>
                                            <Grid size={1}>
                                                <IconButton size='small' onClick={() => deleteSplitCat(x.recId)}><CloseIcon /></IconButton>
                                            </Grid>
                                        </>
                                    ))}
                                    <Grid size={12}>
                                        <Button fullWidth color='secondary' onClick={addSplit} startIcon={<AddIcon fontSize='small' />}>Add Category Split</Button>
                                    </Grid>
                                </Grid>
                                :
                                <></>
                            }

                        </Grid>
                    </DialogContent>
                    <Box sx={{ mx: 1, mt: 0.5 }}><Typography color='error'>{errorText}</Typography></Box>
                    <DialogActions>
                        <Button fullWidth startIcon={<AddIcon />} type='submit' variant='contained'>Add Transaction</Button>
                    </DialogActions>
                </Box>
            </Dialog>
        </>
    )
}
