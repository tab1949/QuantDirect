'use client';

import { useTranslation } from "react-i18next";
import styled from "styled-components";
import TimeDisplay from "./TimeDisplay";
import * as FetchData from "./FetchData";
import { HorizontalLine, Title1, Title2, InlineT3, ScrollList, ListItem, Div } from "../components/BasicLayout";
import CandleStickChart from "../components/CandleStickChart";
import { useState, useEffect, useCallback, useRef } from "react";

interface ViewAreaProps {
    $content: string
}

const SubjectListItem = styled(ListItem)`
    font-size: 1.2rem;
    padding: 5px;
`;

const ContractListItem = styled(ListItem)`
    display: flex;
    flex-direction: column;
    align-items: start;
    font-size: 1.1rem;
    height: 70px;
    padding: 3px;
`;

const ContractInfoItem = styled(ListItem)`
    font-size: 1.2rem;
    margin-top: 2px;
    margin-bottom: 5px;
    margin-left: 0;
    padding-left: 0.65rem;
    align-content: end;
`;

interface FuturesContentProps {
    exchange: string;
}

function FuturesContent({ exchange }: FuturesContentProps) {
    const { t } = useTranslation('explore');
    const [assets, setAssets] = useState<{name: string, code: string}[]>([]);
    const [selectedAsset, setSelectedAsset] = useState<{code: string, exchange: string}>({code: 'AG', exchange: 'SHF'});
    const [sortOpt, setSortOpt] = useState(1); // 0: ALL; 1: Active; 2: Most Active; 3: Continuous
    const [contracts, setContracts] = useState<FetchData.ContractInfo[]>([]);
    const [selectedContract, setSelectedContract] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [infoContent, setInfoContent] = useState(<></>);
    const [data, setData] = useState<FetchData.FuturesContractData | null>(null);
    const contractList = useRef<string[]>([]);

    const optionClicked = useCallback(() => {
        if (sortOpt == 1) setSortOpt(0);
        else setSortOpt(1);
    }, [sortOpt]);

    useEffect(() => {(async () => {
        try {
            setLoading(true);
            setError(null);
            setAssets(
                ((await FetchData.GetSubjectAssets(exchange)) || [])
                    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN-u-co-pinyin')));
            contractList.current = (await FetchData.GetContractsList(exchange)) || [];
        } catch (err) {
            setError(`${t('fetch_failed')}: ${err}`);
            setAssets([]);
        } finally {
            setLoading(false);
        }
    })(); }, [exchange, t]);

    useEffect(() => {(async () => {
        const currentDate = new Date().toISOString().slice(0,10).replace(/-/g, '');
        const c: FetchData.ContractInfo[] = [];
        const info = await FetchData.GetContractInfoByAsset(selectedAsset.code, selectedAsset.exchange);
        switch (sortOpt) {
        case 0: {
            for (const i of info) {
                c.push(i);
            }
            c.sort((a: FetchData.ContractInfo, b: FetchData.ContractInfo): number => {
                return Number(b.delist_date) - Number(a.delist_date);
            });
            break;
        }
        case 1: {
            for (const i of info) {
                if (!i.delist_date || i.delist_date > currentDate) 
                    c.push(i);
            }
            c.sort((a: FetchData.ContractInfo, b: FetchData.ContractInfo): number => {
                return Number(a.delist_date) - Number(b.delist_date);
            });
            break;
        }
        }
        setContracts(c);
    })();}, [selectedAsset, sortOpt, exchange]);

    useEffect(() => {(async () => {
        if (selectedContract == null)
            return;
        const i = selectedContract as FetchData.ContractInfo;
        const c = <ScrollList>
            <div>{t('contracts.name')}{": "}{}</div>
            <ContractInfoItem>{i.name}</ContractInfoItem>
            <div>{t('contracts.code')}{": "}</div>
            <ContractInfoItem>{i.code}</ContractInfoItem>
            <div>{t('contracts.symbol')}{": "}</div>
            <ContractInfoItem>{i.symbol}</ContractInfoItem>
            <div>{t('contracts.exchange')}{": "}</div>
            <ContractInfoItem>{i.exchange}</ContractInfoItem>
            <div>{t('contracts.trade_unit')}{": "}</div>
            <ContractInfoItem>{i.per_unit}{i.trade_unit}</ContractInfoItem>
            <div>{t('contracts.quote_unit')}{": "}</div>
            <ContractInfoItem>{i.quote_unit}</ContractInfoItem>
            <div>{t('contracts.quote_unit_desc')}{": "}</div>
            <ContractInfoItem>{i.quote_unit_desc}</ContractInfoItem>
            <div>{t('contracts.d_mode')}{": "}</div>
            <ContractInfoItem>{i.d_mode_desc}</ContractInfoItem>
            <div>{t('contracts.d_month')}{": "}</div>
            <ContractInfoItem>{i.d_month}</ContractInfoItem>
            <div>{t('contracts.list_date')}{": "}</div>
            <ContractInfoItem>{i.list_date}</ContractInfoItem>
            <div>{t('contracts.delist_date')}{": "}</div>
            <ContractInfoItem>{i.delist_date}</ContractInfoItem>
            <div>{t('contracts.trade_time')}{": "}</div>
            <div>{i.trade_time_desc}</div>
        </ScrollList>;
        setInfoContent(c);

        setData(await FetchData.GetContractData(i.code));

    })();}, [selectedContract, t]);

    return (
        <div style={{
            display: "flex",
            flexDirection: "row",
            height: "calc(100vh - 180px)",
            gap: "10px",
            padding: "10px"
        }}>
            <div style={{
                width: "7rem",
                height: "100%",
                borderRadius: "8px",
                border: "2px solid var(--theme-border-color)",
            }}>
                <ScrollList>
                    {loading ? (
                        <SubjectListItem>{t('loading')}</SubjectListItem>
                    ) : error ? (
                        <SubjectListItem style={{ color: 'red' }}>{error}</SubjectListItem>
                    ) : assets.length === 0 ? (
                        <SubjectListItem>{t('no_data')}</SubjectListItem>
                    ) : (
                        assets.map((asset, index) => (
                            <SubjectListItem key={`${asset}-${index}`} onClick={()=>{setSelectedAsset({code: asset.code, exchange: exchange});}}>
                                <div>{asset.name}</div>
                            </SubjectListItem>
                        ))
                    )}
                </ScrollList>
            </div>
            
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                height: "100%",
                minWidth: "6.9rem",
                fontSize: '1rem',
                border: "2px solid var(--theme-border-color)",
                borderRadius: "8px",
                backgroundColor: "transparent"
            }}>
                <div style={{
                    border: "2px solid var(--theme-border-color)",
                    borderRadius: "8px",
                    margin: '3px'
                }}>
                    <ScrollList>
                        <InlineT3 style={{fontSize:'1.2rem'}}>{t('sort')}{':'}</InlineT3>
                        <ListItem style={{margin: '3px', width: '90%'}} onClick={optionClicked}>{t('all_contracts')}{sortOpt == 0? " √": ''}</ListItem>
                    </ScrollList>
                </div>
                <ScrollList>
                    {contracts.map((contract, index) => (
                        <ContractListItem key={`${contract.code}-${index}`} onClick={() => {setSelectedContract(contract);}}>
                            <div>{contract.name}</div>
                            <div style={{fontSize: '0.8rem'}}>{contract.symbol}</div>
                        </ContractListItem>
                    ))}
                </ScrollList>
            </div>

            <div style={{
                display: 'flex',
                flexDirection: 'row',
                position: 'relative',
                height: "100%",
                width: '91%',
                minWidth: "90px",
                fontSize: '19px',
                border: "2px solid var(--theme-border-color)",
                borderRadius: "8px",
                backgroundColor: "transparent"
            }}>
                <Div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '8.7rem',
                    fontSize: '0.85rem',
                    border: "2px solid var(--theme-border-color)",
                    borderRadius: "8px",
                    margin: '3px'}}>
                    {infoContent}
                </Div>
                {data? <Div style={{
                    position: 'relative',
                    height: '70%',
                    width: '60%'
                }}>
                    <CandleStickChart data={data}></CandleStickChart>
                </Div>: <Title1>{t('no_data')}</Title1>}
            </div>
        </div>
    );
}

export default function ViewArea(props: ViewAreaProps) {
    const { t } = useTranslation('explore');
    let title: string = '';
    let content = null;
    switch (props.$content) {
    case 'futures-overview':
        title = t('list.futures');
        content = <Div>
            <Title2>{t('intro.futures')}</Title2>
        </Div>;
        break;
    case 'stocks-overview':
        title = t('list.stocks');
        break;
    case 'futures-DCE':
        title = t('list.DCE');
        content = <FuturesContent exchange="DCE" />;
        break;
    case 'futures-CZCE':
        title = t('list.CZCE');
        content = <FuturesContent exchange="CZCE" />;
        break;
    case 'futures-SHFE':
        title = t('list.SHFE');
        content = <FuturesContent exchange="SHFE" />;
        break;
    case 'futures-GFEX':
        title = t('list.GFEX');
        content = <FuturesContent exchange="GFEX" />;
        break;
    case 'futures-CFFEX':
        title = t('list.CFFEX');
        content = <FuturesContent exchange="CFFEX" />;
        break;
    case 'futures-INE':
        title = t('list.INE');
        content = <FuturesContent exchange="INE" />;
        break;
    case 'stocks-CN':
        title = t('list.CN');
        break;
    case 'stocks-HK':
        title = t('list.HK');
        break;
    case 'stocks-US':
        title = t('list.US');
        break;
    default:
    case 'overview':
        title = t('list.overview');
        content = (
            <div style={{
                position: "absolute",
                bottom: "0",
                width: "100%",
                display: "flex",
                justifyContent: "center"
            }}>
                <InlineT3>{t('notice')}</InlineT3>
            </div>
        );
        break;
    }
    return <div style={{
        userSelect: "none",
        backgroundColor: "transparent",
        position: "relative",
        width: "calc(100vw - 10rem)",
        height: "100%",
        color: "white",
        display: "flex",
        flexDirection: "column",
    }}> 
        <TimeDisplay $title={title}/>
        <HorizontalLine $width="5px" $length="99%" $align="center"/>
        { content } 
    </div>;
}