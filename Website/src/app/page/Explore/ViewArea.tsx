'use client';

import { useTranslation } from "react-i18next";
import styled from "styled-components";
import TimeDisplay from "./TimeDisplay";
import * as FetchData from "./FetchData";
import { HorizontalLine, InlineT3, ScrollList, ListItem, Div } from "../components/BasicLayout";
import { useState, useEffect, useCallback, useRef } from "react";

const exchange_postfix: { [key: string]: string } = {
    'DCE': '.DCE',
    'CZCE': '.ZCE',
    'SHFE': '.SHF',
    'GFEX': '.GFE',
    'CFFEX': '.CFX',
    'INE': '.INE'
}

interface ViewAreaProps {
    $content: string
}

const SubjectListItem = styled(ListItem)`
    font-size: 19px;
    padding: 5px;
`;

const ContractListItem = styled(ListItem)`
    display: flex;
    flex-direction: column;
    align-items: start;
    font-size: 17px;
    height: 70px;
    padding: 3px;
`;

const ContractInfoItem = styled(ListItem)`
    font-size: 21px;
    margin-top: 2px;
    margin-bottom: 5px;
    margin-left: 10px;
    align-content: end;
`;

interface FuturesContentProps {
    exchange: string;
}

function FuturesContent({ exchange }: FuturesContentProps) {
    const { t } = useTranslation('explore');
    const [assets, setAssets] = useState<{name: string, code: string}[]>([]);
    const [selectedAsset, setSelectedAsset] = useState<string>('AG');
    const [sortOpt, setSortOpt] = useState(1); // 0: ALL; 1: Active; 2: Most Active; 3: Continuous
    const [contracts, setContracts] = useState<FetchData.ContractInfo[]>([]);
    const [selectedContract, setSelectedContract] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [infoContent, setInfoContent] = useState(<></>);
    const contractList = useRef<string[]>([]);

    const optionClicked = useCallback(() => {
        if (sortOpt == 1) setSortOpt(0);
        else setSortOpt(1);
    }, [sortOpt]);

    useEffect(() => {(async () => {
        try {
            setLoading(true);
            setError(null);
            setAssets((await FetchData.GetSubjectAssets(exchange)) || []);
            contractList.current = (await FetchData.GetContractsList(exchange)) || [];
        } catch (err) {
            setError(`${t('fetch_failed')}: ${err}`);
            setAssets([]);
        } finally {
            setLoading(false);
        }
    })(); }, [exchange, t]);

    // TODO: Optimize sorting performance
    useEffect(() => {(async () => {
        const currentDate = new Date().toISOString().slice(0,10).replace(/-/g, '');
        const c: FetchData.ContractInfo[] = [];
        switch (sortOpt) {
        case 0: {
            for (const i of contractList.current) {
                if (i.replace(exchange_postfix[exchange], '').replace(/(TAS|连续|主力)$/g, '').replace(/\d+$/, '') == selectedAsset) {
                    const info = await FetchData.GetContractInfo(i); 
                    c.push(info);
                }
            }
            c.sort((a: FetchData.ContractInfo, b: FetchData.ContractInfo): number => {
                return Number(b.delist_date) - Number(a.delist_date);
            });
            break;
        }
        case 1: {
            for (const i of contractList.current) {
                if (i.replace(exchange_postfix[exchange], '').replace(/(TAS|连续|主力)$/g, '').replace(/\d+$/, '') == selectedAsset) {
                    const info = await FetchData.GetContractInfo(i);
                    if (!info.delist_date || info.delist_date > currentDate) 
                        c.push(info);
                }
            }
            c.sort((a: FetchData.ContractInfo, b: FetchData.ContractInfo): number => {
                return Number(a.delist_date) - Number(b.delist_date);
            });
            break;
        }
        }
        setContracts(c);
    })();}, [selectedAsset, sortOpt, exchange]);

    useEffect(() => {
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
            <ContractInfoItem>{i.trade_unit}</ContractInfoItem>
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
    }, [selectedContract, t]);

    return (
        <div style={{
            display: "flex",
            flexDirection: "row",
            height: "calc(100vh - 180px)",
            gap: "10px",
            padding: "10px"
        }}>
            <div style={{
                width: "10%",
                minWidth: "100px",
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
                            <SubjectListItem key={`${asset}-${index}`} onClick={()=>{setSelectedAsset(asset.code);}}>
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
                width: '9%',
                minWidth: "90px",
                fontSize: '19px',
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
                        <InlineT3 style={{fontSize:'19px'}}>{t('sort')}{':'}</InlineT3>
                        <ListItem style={{margin: '3px', width: '90%'}} onClick={optionClicked}>{t('all_contracts')}{sortOpt == 0? " √": ''}</ListItem>
                    </ScrollList>
                </div>
                <ScrollList>
                    {contracts.map((contract, index) => (
                        <ContractListItem key={`${contract.code}-${index}`} onClick={() => {setSelectedContract(contract);}}>
                            <div>{contract.name}</div>
                            <div style={{fontSize: '15px'}}>{contract.symbol}</div>
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
                    width: '150px',
                    fontSize: '15px',
                    border: "2px solid var(--theme-border-color)",
                    borderRadius: "8px",
                    margin: '3px'}}>
                    {infoContent}

                </Div>
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
        width: "calc(95vw - 100px)",
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