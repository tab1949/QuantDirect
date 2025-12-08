'use client';

import { useTranslation } from "react-i18next";
import styled from "styled-components";
import * as FetchData from "./FetchData";
import { Title1, Title2, InlineT3, ScrollList, ListItem, Div } from "../../components/BasicLayout";
import { ChartContainer } from "../../components/ChartContainer";
import { useState, useEffect, useCallback, useRef } from "react";

interface ViewAreaProps {
    $content: string
}

const SubjectListItem = styled(ListItem)`
    display: flex;
    flex-direction: column;
    align-items: start;
    font-size: 1.2rem;
    padding: 0.1rem;
    padding-left: 0.2rem;
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

const HeaderOption = styled.div`
    position: relative;
    height: 100%;
    font-size: 18px;
    padding: 0px;
    margin-left: 5px;
    margin-top: 3px;
    margin-bottom: 3px;
    border-radius: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 2px solid var(--theme-border-color);
    &:hover {
        background-color: var(--theme-border-color);
        cursor: pointer;
    }
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
    const [selectedContract, setSelectedContract] = useState<FetchData.ContractInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [infoContent, setInfoContent] = useState(<></>);
    const [data, setData] = useState<FetchData.FuturesContractData | null>(null);
    const contractList = useRef<string[]>([]);
    const [viewMode, setViewMode] = useState<'market_quotation' | 'contract_info'>('market_quotation');

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

    const toggleAssetLeftBorder = useCallback((option: string): string => {
        return selectedAsset.code === option ? '4px solid var(--theme-font-color)' : 'none';
    }, [selectedAsset]);

    const toggleContractLeftBorder = useCallback((option: string): string => {
        return selectedContract?.symbol === option ? '3px solid var(--theme-font-color)' : 'none';
    }, [selectedContract]);

    return (
        <div style={{
            position: "relative",
            width: "calc(100vw - 125px)",
            display: "flex",
            flexDirection: "row",
            height: "100%",
            gap: "5px",
            padding: "10px"
        }}>
            <div style={{
                width: "100px",
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
                            <SubjectListItem 
                                key={`${asset}-${index}`} 
                                onClick={()=>{setSelectedAsset({code: asset.code, exchange: exchange});}}
                                style={{borderLeft: toggleAssetLeftBorder(asset.code)}}>
                                <div>{asset.name}</div>
                                <div style={{fontSize: '1rem', justifySelf:"end"}}>{asset.code}</div>
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
                width: "120px",
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
                        <ContractListItem 
                            key={`${contract.code}-${index}`} 
                            onClick={() => {setSelectedContract(contract);}}
                            style={{borderLeft: toggleContractLeftBorder(contract.symbol)}}>
                            <div>{contract.name}</div>
                            <div style={{fontSize: '0.8rem'}}>{contract.symbol}</div>
                        </ContractListItem>
                    ))}
                </ScrollList>
            </div>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                right: '0px',
                height: "100%",
                width: 'calc(100% - 230px)',
                fontSize: '19px',
                border: "2px solid var(--theme-border-color)",
                borderRadius: "8px",
                backgroundColor: "transparent"
            }}>
                {/* Header */}
                <Div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    position: 'relative',
                    border: "2px solid var(--theme-border-color)",
                    borderRadius: "8px",
                    margin: '3px',
                    width: 'calc(100% - 6px)',
                    height: '36px',
                    fontSize: '24px',}}>
                    <HeaderOption 
                        style={{backgroundColor: viewMode=='market_quotation'?'var(--theme-border-color)':'transparent'}}
                        onClick={() => {setViewMode('market_quotation');}}>
                        {t('market_quotation')}
                    </HeaderOption>
                    <HeaderOption 
                        style={{backgroundColor: viewMode=='contract_info'?'var(--theme-border-color)':'transparent'}}
                        onClick={() => {setViewMode('contract_info');}}>
                        {t('contract_info')}
                    </HeaderOption>
                </Div>
                {/* Display Area */}
                {viewMode === 'contract_info' && <Div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: 'fit-content',
                    fontSize: '0.85rem',
                    border: "2px solid var(--theme-border-color)",
                    borderRadius: "8px",
                    margin: '3px'}}>
                    {infoContent}
                </Div>}
                {viewMode === 'market_quotation' && (data? <Div style={{
                    position: 'relative',
                    height: '70%',
                    width: '60%'
                }}>
                    <ChartContainer 
                        $data={data} $layout='vertical'
                        $components={[{
                            type: 'CandleStickChart',
                            position: {
                                height: 0.7
                            }
                        }, {
                            type: 'BarChart',
                        }]}/>
                </Div>: <Title1>{t('no_data')}</Title1>)}
            </div>
        </div>
    );
}

export default function ViewArea(props: ViewAreaProps) {
    const { t } = useTranslation('explore');
    let content = null;
    switch (props.$content) {
    case 'futures-overview':
        content = <Div>
            <Title2>{t('intro.futures')}</Title2>
        </Div>;
        break;
    case 'stocks-overview':
        break;
    case 'futures-DCE':
        content = <FuturesContent exchange="DCE" />;
        break;
    case 'futures-CZCE':
        content = <FuturesContent exchange="CZCE" />;
        break;
    case 'futures-SHFE':
        content = <FuturesContent exchange="SHFE" />;
        break;
    case 'futures-GFEX':
        content = <FuturesContent exchange="GFEX" />;
        break;
    case 'futures-CFFEX':
        content = <FuturesContent exchange="CFFEX" />;
        break;
    case 'futures-INE':
        content = <FuturesContent exchange="INE" />;
        break;
    case 'stocks-CN':
        break;
    case 'stocks-HK':
        break;
    case 'stocks-US':
        break;
    default:
    case 'overview':
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
        { content } 
    </div>;
}