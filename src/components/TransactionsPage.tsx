import React from 'react';
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { useTableStore } from "../store/tableStore";
import { useModalStore } from "../store/modalStore";
import ListItem from "@mui/material/ListItem";
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import Divider from "@mui/material/Divider";
import dayjs from "dayjs";
import Box from '@mui/material/Box';
import ListItemButton from '@mui/material/ListItemButton';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import TextField from "@mui/material/TextField";
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import { alpha } from '@mui/material/styles';

const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

export default function TransactionsPage() {
    const transactionsArray = useTableStore(s => s.transactions)
    const [filteredTransactions, setFilteredTransactions] = React.useState(transactionsArray)
    React.useEffect(() => {
        filterTransactions(searchText)
    }, [transactionsArray])
    const [searchText, setSearchText] = React.useState('')
    function setText(event: any) {
        setSearchText(event.target.value)
        filterTransactions(event.target.value)
    }
    const filterTransactions = (targetText: string) => {
        if (targetText.length > 0) {
            const filtered = transactionsArray.filter((data) => JSON.stringify({ [data.title]: data.amount }).toLowerCase().indexOf(targetText.toLowerCase()) !== -1);
            setFilteredTransactions(filtered)
        } else {
            setFilteredTransactions(transactionsArray)
        }
    }
    const categoryArray = useTableStore(s => s.categories)
    const sectionsArray = useTableStore(s => s.sections)
    const setCurrentTransaction = useModalStore(s => s.setCurrentTransaction)
    const setOpenEditTransaction = useModalStore(s => s.setEditTransaction)
    const openTransaction = (trsID: string) => {
        setCurrentTransaction(trsID)
        setOpenEditTransaction(true)
    }
    React.useEffect(() => {
        window.scrollTo(0, 0)
    }, [])
    const uncategorized = filteredTransactions.filter(x => x.categoryID === null).length > 0 ?
        <Box sx={{ width: '100%' }}>
            <Paper elevation={4} sx={{ width: '100%', borderRadius: 3 }}>
                <List dense>
                    <ListItem disablePadding key={"1"}>
                        <Typography color='text.secondary' variant='h6'
                            sx={{ fontWeight: '600', ml: 1 }}>Uncategorized</Typography>
                    </ListItem>
                    {filteredTransactions.filter(x => x.categoryID === null).sort(
                        (a, b) => {
                            return b.transactionDate - a.transactionDate;
                        }
                    ).map((row) => (
                        <>
                            <Divider />
                            <ListItem disablePadding key={row.recordID}>
                                <ListItemButton onClick={() => openTransaction(row.recordID)}>
                                    <Grid size={12} container columnSpacing={1} alignItems='center' sx={{ width: '100%' }}>
                                        <Grid size={1.3}>
                                            <Avatar sx={{ ml: -1, fontSize: 15, textAlign: 'center', bgcolor: 'text.secondary' }}>
                                                {dayjs(row.transactionDate).format('MMM DD')}
                                            </Avatar>
                                        </Grid>
                                        <Grid size='auto' sx={{ flexGrow: 1 }}>
                                            <Typography sx={{ mt: 0.5 }} style={{ overflow: "hidden", textOverflow: "ellipsis" }}
                                                variant='body1'>{row.title}</Typography>
                                            <Chip size='small' label='Uncategorized' color='warning' />
                                        </Grid>
                                        <Grid size='auto' sx={{ textAlign: 'right' }}>
                                            <Typography style={{ overflow: "hidden", textOverflow: "ellipsis" }} display='inline'
                                                variant='body1'>{(row.transactionType === 'expense' ? '-' : '+') + formatter.format(row.amount)}</Typography>
                                        </Grid>
                                    </Grid>
                                </ListItemButton>
                            </ListItem>
                        </>
                    ))}
                </List>
            </Paper>
        </Box> : null

    const categorized = filteredTransactions.filter(x => x.categoryID !== null).length > 0 ?
        <Box sx={{ width: '100%' }}>
            <Paper elevation={4} sx={{ width: '100%', borderRadius: 3 }}>
                <List dense>
                    <ListItem disablePadding key={"2"}>
                        <Typography color='text.secondary' variant='h6'
                            sx={{ fontWeight: '600', ml: 1 }}>Categorized</Typography>
                    </ListItem>
                    {filteredTransactions.filter(x => x.categoryID !== null).sort(
                        (a, b) => {
                            return b.transactionDate - a.transactionDate;
                        }
                    ).map((row) => (
                        <>
                            <Divider />
                            <ListItem disablePadding key={row.recordID}>
                                <ListItemButton onClick={() => openTransaction(row.recordID)}>
                                    <Grid size={12} container columnSpacing={1} alignItems='center' sx={{ width: '100%' }}>
                                        <Grid size={1.3}>
                                            <Avatar sx={{ ml: -1, fontSize: 15, textAlign: 'center', bgcolor: 'text.secondary' }}>
                                                {dayjs(row.transactionDate).format('MMM DD')}
                                            </Avatar>
                                        </Grid>
                                        <Grid size='grow'>
                                            <Typography sx={{ mt: 0.5 }} style={{ overflow: "hidden", textOverflow: "ellipsis" }}
                                                variant='body1'>{row.title}</Typography>
                                            <Chip size='small'
                                                label={categoryArray.find(x => x.recordID === row.categoryID)?.categoryName}
                                                sx={(theme) => {
                                                    const category = categoryArray.find(x => x.recordID === row.categoryID)
                                                    const section = sectionsArray.find(x => x.recordID === category?.sectionID)
                                                    return {
                                                        backgroundColor:
                                                            section?.sectionType === 'expense' ? alpha(theme.palette.warning.light, 0.5) : alpha(theme.palette.success.light, 0.5)
                                                    }
                                                }}
                                            />
                                        </Grid>
                                        <Grid size='auto' sx={{ textAlign: 'right' }}>
                                            <Typography style={{ overflow: "hidden", textOverflow: "ellipsis" }} display='inline'
                                                variant='body1'>{(row.transactionType === 'expense' ? '-' : '+') + formatter.format(row.amount)}</Typography>
                                        </Grid>
                                    </Grid>
                                </ListItemButton>
                            </ListItem >
                        </>
                    ))}
                </List>
            </Paper>
        </Box > : null

    return (
        <>
            <Box display='flex' flexDirection='column' alignItems='center'>
                <Stack spacing={2} alignItems="stretch" sx={{ maxWidth: 400, width: '100%' }}>
                    <Typography sx={{ alignSelf: 'flex-start' }} color='text.secondary' variant='h6'>Transactions</Typography>
                    <TextField
                        fullWidth
                        size='small'
                        variant='filled'
                        value={searchText}
                        onChange={(event: any) => setText(event)}
                        type="search"
                        label="Search Transactions"
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />

                    {transactionsArray.length > 0 ? [uncategorized, categorized] :
                        <Typography color='text.secondary' variant='h6' sx={{ fontWeight: '300', ml: 1 }}>Nothing here yet!</Typography>}
                </Stack>
            </Box>
        </>
    )
}
