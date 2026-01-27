'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { getDetectedLanguage } from '../locales/client-i18n';
import { ListItem, ScrollList } from '../components/BasicLayout';
import type { AppSettings, DataSourceKey, DataSourceEntry } from '../../../types/settings';
import type { ElectronAPI } from '../../../types/window-controls';
import { normalizeTradingAccount, normalizePort } from "../utils/validation";

type SettingsPageProps = {
    settings: AppSettings;
    onChange: (patch: Partial<AppSettings>) => void;
    darkMode: boolean;
};

type Category = 'general' | 'data' | 'trading';

type EndpointParts = {
    host: string;
    port: string;
    uri: string;
};

type Option<T extends string> = {
    value: T;
    label: string;
    description?: string;
};

type EndpointEditorProps = {
    label: string;
    value: string;
    defaults: EndpointParts;
    parseEndpoint: (value: string, defaults: EndpointParts) => EndpointParts;
    buildEndpoint: (parts: EndpointParts) => string;
    onChange: (value: string) => void;
    t: ReturnType<typeof useTranslation>['t'];
};

export const DATA_SOURCE_DEFAULTS = {
  futuresCalendar: { localPath: '', apiUrl: 'https://data.tabxx.net/api/futures' },
  futuresContracts: { localPath: '', apiUrl: 'https://data.tabxx.net/api/futures' },
  futuresTick: { localPath: '', apiUrl: 'https://data.tabxx.net/api/futures' },
  futures1m: { localPath: '', apiUrl: 'https://data.tabxx.net/api/futures' },
  brokerPositions: { localPath: '', apiUrl: 'https://data.tabxx.net/api/futures' },
  optionsContracts: { localPath: '', apiUrl: 'https://data.tabxx.net/api/options' },
  optionsTick: { localPath: '', apiUrl: 'https://data.tabxx.net/api/options' }
} as const;

const DEFAULT_ENGINE_ADDRESS = 'localhost';
const DEFAULT_ENGINE_PORT = 9999;

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'system',
  engineAddress: DEFAULT_ENGINE_ADDRESS,
  enginePort: DEFAULT_ENGINE_PORT,
  marketDataEndpoint: 'ws://localhost:8888/market_data',
  tradingEndpoint: 'ws://localhost:8888/trading',
  dataSources: { ...DATA_SOURCE_DEFAULTS },
  tradingAccount: null
};

const detectSystemTheme = (): 'dark' | 'light' => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
};

export const resolveDarkMode = (settings: AppSettings): boolean => {
  const theme = settings.theme === 'system' ? detectSystemTheme() : settings.theme;
  return theme === 'dark';
};

export const resolveLanguage = (settings: AppSettings): AppSettings['language'] => {
  if (settings.language === 'system') {
    return getDetectedLanguage();
  }
  return settings.language;
};

const normalizeThemeSetting = (theme?: AppSettings['theme']): AppSettings['theme'] => {
  if (theme === 'dark' || theme === 'light') {
    return theme;
  }
  return 'system';
};

const normalizeLanguageSetting = (language?: AppSettings['language']): AppSettings['language'] => {
  if (language === 'en-US' || language === 'zh-CN' || language === 'zh-HK') {
    return language;
  }
  return 'system';
};

export const normalizeSettings = (settings?: Partial<AppSettings> | null): AppSettings => ({
  theme: normalizeThemeSetting(settings?.theme),
  language: normalizeLanguageSetting(settings?.language),
    engineAddress: typeof settings?.engineAddress === 'string' && settings.engineAddress.trim().length > 0
        ? settings.engineAddress.trim()
        : DEFAULT_ENGINE_ADDRESS,
    enginePort: normalizePort(settings?.enginePort) ?? DEFAULT_ENGINE_PORT,
  marketDataEndpoint: typeof settings?.marketDataEndpoint === 'string' && settings.marketDataEndpoint.trim().length > 0
    ? settings.marketDataEndpoint.trim()
    : DEFAULT_SETTINGS.marketDataEndpoint,
  tradingEndpoint: typeof settings?.tradingEndpoint === 'string' && settings.tradingEndpoint.trim().length > 0
    ? settings.tradingEndpoint.trim()
    : DEFAULT_SETTINGS.tradingEndpoint,
  dataSources: (Object.keys(DATA_SOURCE_DEFAULTS) as (keyof typeof DATA_SOURCE_DEFAULTS)[]).reduce((acc, key) => {
    const entry = settings?.dataSources?.[key];
    const localPath = typeof entry?.localPath === 'string' ? entry.localPath.trim() : '';
    const apiUrl = typeof entry?.apiUrl === 'string' ? entry.apiUrl.trim() : '';
    const hasLocal = Boolean(localPath);
    const hasApi = Boolean(apiUrl);

    if (hasLocal || hasApi) {
      acc[key] = {
        localPath,
        apiUrl // allow empty when local provided
      };
    } else {
      acc[key] = { ...DATA_SOURCE_DEFAULTS[key] };
    }
    return acc;
  }, {} as AppSettings['dataSources']),
  tradingAccount: normalizeTradingAccount(settings?.tradingAccount)
});

function OptionTitle({ title }: { title: string }) {
    return <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--theme-font-color)' }}>{title}</div>;
}

function OptionButton<T extends string>({
    option,
    selected,
    onSelect
}: {
    option: Option<T>;
    selected: boolean;
    onSelect: (value: T) => void;
}) {
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(option.value)}
            style={{
                padding: '10px 14px',
                marginRight: '12px',
                marginBottom: '8px',
                borderRadius: '10px',
                border: selected ? '2px solid var(--theme-font-color-hover)' : '1px solid var(--theme-border-color)',
                backgroundColor: selected ? 'rgba(90, 100, 112, 0.15)' : 'rgba(0,0,0,0.02)',
                color: 'var(--theme-font-color-content)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                minWidth: '120px',
                textAlign: 'left'
            }}
        >
            <div style={{ fontWeight: 600 }}>{option.label}</div>
            {option.description ? (
                <div style={{ fontSize: '12px', color: 'var(--theme-font-color)' }}>{option.description}</div>
            ) : null}
        </button>
    );
}

function EndpointEditor({ label, value, defaults, parseEndpoint, buildEndpoint, onChange, t }: EndpointEditorProps) {
    const parts = parseEndpoint(value, defaults);

    const update = (patch: Partial<EndpointParts>) => {
        const nextParts: EndpointParts = {
            host: patch.host ?? parts.host,
            port: patch.port ?? parts.port,
            uri: patch.uri ?? parts.uri
        };
        onChange(buildEndpoint(nextParts));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontWeight: 600 }}>{label}</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ color: 'var(--theme-font-color)' }}>ws://</span>
                <input
                    type="text"
                    aria-label={t('settings.server_address')}
                    placeholder={t('settings.server_address')}
                    value={parts.host}
                    onChange={(e) => update({ host: e.target.value })}
                    style={{
                        flex: '1 1 140px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--theme-border-color)',
                        backgroundColor: 'rgba(0,0,0,0.02)',
                        color: 'var(--theme-font-color-content)'
                    }}
                />
                <span style={{ color: 'var(--theme-font-color)' }}>:</span>
                <input
                    type="number"
                    aria-label={t('settings.server_port')}
                    placeholder={t('settings.server_port')}
                    value={parts.port}
                    onChange={(e) => update({ port: e.target.value })}
                    style={{
                        width: '110px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--theme-border-color)',
                        backgroundColor: 'rgba(0,0,0,0.02)',
                        color: 'var(--theme-font-color-content)'
                    }}
                />
                <span style={{ color: 'var(--theme-font-color)' }}>/</span>
                <input
                    type="text"
                    aria-label={t('settings.server_uri')}
                    placeholder={t('settings.server_uri')}
                    value={parts.uri}
                    onChange={(e) => update({ uri: e.target.value })}
                    style={{
                        flex: '1 1 140px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--theme-border-color)',
                        backgroundColor: 'rgba(0,0,0,0.02)',
                        color: 'var(--theme-font-color-content)'
                    }}
                />
            </div>
            <div
                style={{
                    fontFamily: 'Consolas, SFMono-Regular, Menlo, monospace',
                    fontSize: '13px',
                    color: 'var(--theme-font-color)',
                    background: 'rgba(0,0,0,0.03)',
                    border: '1px solid var(--theme-border-color)',
                    borderRadius: '8px',
                    padding: '8px 10px'
                }}
            >
                {buildEndpoint(parts)}
            </div>
        </div>
    );
}

type DataSourceRowProps = {
    id: DataSourceKey;
    label: string;
    defaults: string;
    entry: DataSourceEntry;
    normalize: (entry: DataSourceEntry, key: DataSourceKey) => DataSourceEntry;
    onChange: (key: DataSourceKey, entry: DataSourceEntry) => void;
    t: ReturnType<typeof useTranslation>['t'];
};

function DataSourceRow({ id, label, defaults, entry, normalize, onChange, t }: DataSourceRowProps) {
    const fileInputId = `ds-file-${id}`;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const filePath = (file as { path?: string } | undefined)?.path || '';
        const next = normalize({ ...entry, localPath: filePath }, id);
        onChange(id, next);
        e.target.value = '';
    };

    const handleLocalChange = (value: string) => {
        const next = normalize({ ...entry, localPath: value }, id);
        onChange(id, next);
    };

    const handleApiChange = (value: string) => {
        const next = normalize({ ...entry, apiUrl: value }, id);
        onChange(id, next);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <OptionTitle title={label} />
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                    type="text"
                    aria-label={t('settings.local_file')}
                    placeholder={t('settings.local_file')}
                    value={entry.localPath}
                    onChange={(e) => handleLocalChange(e.target.value)}
                    style={{
                        flex: '1 1 220px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--theme-border-color)',
                        backgroundColor: 'rgba(0,0,0,0.02)',
                        color: 'var(--theme-font-color-content)'
                    }}
                />
                <label htmlFor={fileInputId}
                    style={{
                        boxSizing: 'border-box',
                        display: 'inline-flex',
                        alignItems: 'center',
                        height: '37px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--theme-border-color)',
                        backgroundColor: 'rgba(90, 100, 112, 0.08)',
                        color: 'var(--theme-font-color-content)',
                        userSelect: 'none'
                    }}
                >{t('settings.browse')}</label>
                <input
                    id={fileInputId}
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />
                <input
                    type="text"
                    aria-label={t('settings.api_url')}
                    placeholder={`${t('settings.api_url')} (${defaults})`}
                    value={entry.apiUrl}
                    onChange={(e) => handleApiChange(e.target.value)}
                    style={{
                        flex: '1 1 260px',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--theme-border-color)',
                        backgroundColor: 'rgba(0,0,0,0.02)',
                        color: 'var(--theme-font-color-content)'
                    }}
                />
            </div>
        </div>
    );
}

export default function SettingsPage({ settings, onChange, darkMode }: SettingsPageProps) {
    const { t } = useTranslation();
    const [selectedCategory, setSelectedCategory] = useState<Category>('general');
    const [settingsPath, setSettingsPath] = useState<string>('');
    type WindowWithElectron = Window & { electronAPI?: ElectronAPI };
    const getElectronAPI = () => (typeof window === 'undefined' ? undefined : (window as WindowWithElectron).electronAPI);

    useEffect(() => {
        let cancelled = false;

        const fetchPath = async () => {
            try {
                const path = await getElectronAPI()?.settings?.getPath?.();
                if (!cancelled && path) {
                    setSettingsPath(path);
                }
            } catch (error) {
                void error;
            }
        };

        fetchPath();

        return () => {
            cancelled = true;
        };
    }, []);

    const parseEndpoint = useCallback((value: string, defaults: EndpointParts): EndpointParts => {
        try {
            const url = new URL(value);
            return {
                host: url.hostname || defaults.host,
                port: url.port || defaults.port,
                uri: (url.pathname || '/').replace(/^\//, '') || defaults.uri
            };
        } catch {
            return defaults;
        }
    }, []);

    const buildEndpoint = useCallback((parts: EndpointParts) => `ws://${parts.host || 'localhost'}:${parts.port || '8888'}/${parts.uri || ''}`, []);

    const dataSourceDefaults: Record<DataSourceKey, { label: string; api: string }> = useMemo(() => ({
        futuresCalendar: { label: t('settings.ds_futures_calendar'), api: 'https://data.tabxx.net/api/futures' },
        futuresContracts: { label: t('settings.ds_futures_contracts'), api: 'https://data.tabxx.net/api/futures' },
        futuresTick: { label: t('settings.ds_futures_tick'), api: 'https://data.tabxx.net/api/futures' },
        futures1m: { label: t('settings.ds_futures_1m'), api: 'https://data.tabxx.net/api/futures' },
        brokerPositions: { label: t('settings.ds_broker_positions'), api: 'https://data.tabxx.net/api/futures' },
        optionsContracts: { label: t('settings.ds_options_contracts'), api: 'https://data.tabxx.net/api/options' },
        optionsTick: { label: t('settings.ds_options_tick'), api: 'https://data.tabxx.net/api/options' }
    }), [t]);

    const normalizeDataSourceEntry = useCallback((entry: DataSourceEntry | undefined, key: DataSourceKey): DataSourceEntry => {
        const def = dataSourceDefaults[key].api;
        const localPath = entry?.localPath?.trim() ?? '';
        const apiUrl = entry?.apiUrl?.trim() ?? '';
        if (localPath || apiUrl) {
            return { localPath, apiUrl }; // allow api empty when local provided
        }
        return { localPath: '', apiUrl: def };
    }, [dataSourceDefaults]);

    const themeOptions = useMemo<Option<AppSettings['theme']>[]>(() => ([
        { value: 'system', label: t('settings.follow_system'), description: t('settings.theme_system_desc') },
        { value: 'dark', label: t('settings.theme_dark') },
        { value: 'light', label: t('settings.theme_light') }
    ]), [t]);

    const languageOptions = useMemo<Option<AppSettings['language']>[]>(() => ([
        { value: 'system', label: t('settings.follow_system'), description: t('settings.language_system_desc') },
        { value: 'zh-CN', label: '简体中文', description: t('settings.language_simplified') },
        { value: 'zh-HK', label: '繁體中文', description: t('settings.language_traditional') },
        { value: 'en-US', label: 'English', description: t('settings.language_en') }
    ]), [t]);

    const categories = useMemo(() => ([
        { key: 'general' as Category, label: t('settings.general') },
        { key: 'data' as Category, label: t('settings.data_source') },
        { key: 'trading' as Category, label: t('settings.trading') }
    ]), [t]);

    const renderContent = useCallback(() => {
        switch (selectedCategory) {
            case 'general':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 700 }}>{t('settings.general')}</div>

                        <div>
                            <OptionTitle title={t('settings.config_file')} />
                            <div
                                style={{
                                    userSelect: 'text',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--theme-border-color)',
                                    backgroundColor: 'rgba(0,0,0,0.03)',
                                    fontFamily: 'Consolas, SFMono-Regular, Menlo, monospace',
                                    fontSize: '13px',
                                    color: 'var(--theme-font-color-content)'
                                }}
                            >
                                {settingsPath || t('settings.config_file_unknown')}
                            </div>
                        </div>

                        <div>
                            <OptionTitle title={t('settings.engine')} />
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    aria-label={t('settings.server_address')}
                                    placeholder={t('settings.server_address')}
                                    value={settings.engineAddress}
                                    onChange={(e) => onChange({ engineAddress: e.target.value })}
                                    style={{
                                        flex: '1 1 220px',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--theme-border-color)',
                                        backgroundColor: 'rgba(0,0,0,0.02)',
                                        color: 'var(--theme-font-color-content)'
                                    }}
                                />
                                <span style={{ color: 'var(--theme-font-color)' }}>:</span>
                                <input
                                    type="number"
                                    aria-label={t('settings.engine_port')}
                                    placeholder={t('settings.engine_port')}
                                    value={settings.enginePort || ''}
                                    onChange={(e) => {
                                        const parsed = normalizePort(e.target.value);
                                        onChange({ enginePort: parsed ?? 0 });
                                    }}
                                    style={{
                                        flex: '1 1 220px',
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid var(--theme-border-color)',
                                        backgroundColor: 'rgba(0,0,0,0.02)',
                                        color: 'var(--theme-font-color-content)'
                                    }}
                                />
                            </div>
                            <div
                                style={{
                                    marginTop: '6px',
                                    fontFamily: 'Consolas, SFMono-Regular, Menlo, monospace',
                                    fontSize: '13px',
                                    color: 'var(--theme-font-color)',
                                    background: 'rgba(0,0,0,0.03)',
                                    border: '1px solid var(--theme-border-color)',
                                    borderRadius: '8px',
                                    padding: '8px 10px'
                                }}
                            >
                                {(settings.engineAddress?.trim() || '') && (settings.enginePort && settings.enginePort > 0)
                                    ? `${settings.engineAddress.trim().replace(/\/+$/, '')}:${settings.enginePort}`
                                    : settings.engineAddress?.trim() || t('settings.engine_preview_placeholder')}
                            </div>
                        </div>

                        <div>
                            <OptionTitle title={t('settings.theme')} />
                            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                {themeOptions.map((option) => (
                                    <OptionButton
                                        key={option.value}
                                        option={option}
                                        selected={settings.theme === option.value}
                                        onSelect={(value) => onChange({ theme: value })}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <OptionTitle title={t('settings.language')} />
                            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                {languageOptions.map((option) => (
                                    <OptionButton
                                        key={option.value}
                                        option={option}
                                        selected={settings.language === option.value}
                                        onSelect={(value) => onChange({ language: value })}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'data':
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 700 }}>{t('settings.data_source')}</div>
                        {(Object.keys(dataSourceDefaults) as DataSourceKey[]).map((key) => {
                            const defaults = dataSourceDefaults[key];
                            const entry = normalizeDataSourceEntry(settings.dataSources?.[key], key);
                            return (
                                <DataSourceRow
                                    key={key}
                                    id={key}
                                    label={defaults.label}
                                    defaults={defaults.api}
                                    entry={entry}
                                    normalize={normalizeDataSourceEntry}
                                    onChange={(targetKey, next) => onChange({
                                        dataSources: {
                                            ...settings.dataSources,
                                            [targetKey]: next
                                        }
                                    })}
                                    t={t}
                                />
                            );
                        })}
                    </div>
                );
            case 'trading':
            default:
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div style={{ fontSize: '20px', fontWeight: 700 }}>{t('settings.trading')}</div>

                        <EndpointEditor
                            label={t('settings.market_ws')}
                            value={settings.marketDataEndpoint}
                            defaults={{ host: 'localhost', port: '8888', uri: 'market_data' }}
                            parseEndpoint={parseEndpoint}
                            buildEndpoint={buildEndpoint}
                            onChange={(endpoint) => onChange({ marketDataEndpoint: endpoint })}
                            t={t}
                        />

                        <EndpointEditor
                            label={t('settings.trading_ws')}
                            value={settings.tradingEndpoint}
                            defaults={{ host: 'localhost', port: '8888', uri: 'trading' }}
                            parseEndpoint={parseEndpoint}
                            buildEndpoint={buildEndpoint}
                            onChange={(endpoint) => onChange({ tradingEndpoint: endpoint })}
                            t={t}
                        />
                    </div>
                );
        }
    }, [
        buildEndpoint,
        dataSourceDefaults,
        languageOptions,
        normalizeDataSourceEntry,
        onChange,
        parseEndpoint,
        selectedCategory,
        settings.engineAddress,
        settings.enginePort,
        settings.dataSources,
        settings.language,
        settings.marketDataEndpoint,
        settings.theme,
        settings.tradingEndpoint,
        t,
        themeOptions,
        settingsPath
    ]);

    return (
        <div
            style={{
                userSelect: 'none',
                position: 'fixed',
                display: 'flex',
                left: '5%',
                top: '10%',
                width: '90%',
                height: '80%',
                borderRadius: '12px',
                backgroundColor: 'var(--theme-background-color)',
                boxShadow: darkMode ? '0 0 28px rgba(0, 0, 0, 0.8)' : '0 0 18px rgba(0, 0, 0, 0.12)',
                border: '1px solid var(--theme-border-color)',
                color: 'var(--theme-font-color-content)',
                zIndex: 20,
                overflow: 'hidden'
            }}
        >
            <div
                style={{
                    padding: '18px 22px',
                    height: '100%',
                    display: 'flex',
                    gap: '18px'
                }}
            >
                <div style={{ width: '180px', height: '100%', borderRight: '1px solid var(--theme-border-color)', paddingRight: '12px' }}>
                    <ScrollList style={{ height: '100%', width: '100%', padding: '4px 0' }}>
                        {categories.map((item) => (
                            <ListItem
                                key={item.key}
                                onClick={() => setSelectedCategory(item.key)}
                                style={{
                                    cursor: 'pointer',
                                    padding: '12px 14px',
                                    fontWeight: selectedCategory === item.key ? 700 : 520,
                                    backgroundColor: selectedCategory === item.key ? 'rgba(90, 100, 112, 0.18)' : 'transparent',
                                    borderLeft: selectedCategory === item.key ? '3px solid var(--theme-accent-color)' : '3px solid transparent'
                                }}
                            >
                                {item.label}
                            </ListItem>
                        ))}
                    </ScrollList>
                </div>

                <div style={{ flex: 1, height: '100%' }}>
                    <ScrollList style={{ height: '100%', width: '100%', paddingRight: '6px' }}>
                        <div
                            style={{
                                background: 'rgba(0,0,0,0.02)',
                                borderRadius: '10px',
                                border: '1px solid var(--theme-border-color)',
                                padding: '18px',
                                margin: '0 4px 8px 4px'
                            }}
                        >
                            {renderContent()}
                        </div>
                    </ScrollList>
                </div>
            </div>
        </div>
    );
}