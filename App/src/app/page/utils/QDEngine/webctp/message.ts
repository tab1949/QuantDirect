import * as Flags from "./flags";

export enum MDMsgCode {
    PERFORMED = 0,
    ERROR = 1,
    CONNECTED = 2,
    DISCONNECTED = 3,
    HEARTBEAT_TIMEOUT = 4,
    LOGIN = 5,
    LOGOUT = 6,
    TRADING_DAY = 7,
    SUBSCRIBE = 8,
    UNSUBSCRIBE = 9,
    MARKET_DATA = 10
}

export const MDMsgMap: Record<string, MDMsgCode> = {
    "performed": MDMsgCode.PERFORMED,
    "error": MDMsgCode.ERROR,
    "front_connected": MDMsgCode.CONNECTED,
    "front_disconnected": MDMsgCode.DISCONNECTED,
    "heartbeat_timeout": MDMsgCode.HEARTBEAT_TIMEOUT,
    "login": MDMsgCode.LOGIN,
    "logout": MDMsgCode.LOGOUT,
    "trading_day": MDMsgCode.TRADING_DAY,
    "subscribe": MDMsgCode.SUBSCRIBE,
    "unsubscribe": MDMsgCode.UNSUBSCRIBE,
    "market_data": MDMsgCode.MARKET_DATA
}

export enum TradeMsgCode {
    PERFORMED = 0,
    ERROR,
    ERROR_NULL,
    ERROR_UNKNOWN_VALUE,
    CONNECTED,
    TRADING_DAY,
    DISCONNECTED,
    AUTHENTICATE,
    LOGIN,
    LOGOUT,
    SETTLEMENT_INFO,
    SETTLEMENT_INFO_CONFIRM,
    TRADING_ACCOUNT,
    ORDER_INSERT_ERROR,
    ORDER_INSERT_RETURN_ERROR,
    ORDER_INSERTED,
    ORDER_TRADED,
    QUERY_ORDER,
    ORDER_DELETE_ERROR,
    ORDER_DELETE_RETURN_ERROR,
    ORDER_DELETED,
    QUERY_INSTRUMENT
}

export const TradeMsgMap: Record<string, TradeMsgCode> = {
    "performed": TradeMsgCode.PERFORMED,
    "error": TradeMsgCode.ERROR,
    "error_null": TradeMsgCode.ERROR_NULL,
    "error_unknown_value": TradeMsgCode.ERROR_UNKNOWN_VALUE,
    "front_connected": TradeMsgCode.CONNECTED,
    "trading_day": TradeMsgCode.TRADING_DAY,
    "front_disconnected": TradeMsgCode.DISCONNECTED,
    "authenticate": TradeMsgCode.AUTHENTICATE,
    "login": TradeMsgCode.LOGIN,
    "logout": TradeMsgCode.LOGOUT,
    "settlement_info": TradeMsgCode.SETTLEMENT_INFO,
    "settlement_info_confirm": TradeMsgCode.SETTLEMENT_INFO_CONFIRM,
    "trading_account": TradeMsgCode.TRADING_ACCOUNT,
    "order_insert_error": TradeMsgCode.ORDER_INSERT_ERROR,
    "order_insert_return_error": TradeMsgCode.ORDER_INSERT_RETURN_ERROR,
    "order_inserted": TradeMsgCode.ORDER_INSERTED,
    "order_traded": TradeMsgCode.ORDER_TRADED,
    "query_order": TradeMsgCode.QUERY_ORDER,
    "order_delete_error": TradeMsgCode.ORDER_DELETE_ERROR,
    "order_delete_return_error": TradeMsgCode.ORDER_DELETE_RETURN_ERROR,
    "order_deleted": TradeMsgCode.ORDER_DELETED,
    "query_instrument": TradeMsgCode.QUERY_INSTRUMENT
}

export interface Performed {
    ErrorCode: number;
    RequestID: number;
    Message: string;
}

export interface ErrorInfo {
    code?: number;
    msg?: string;
}

export interface ErrorMessage {
    ReqId: number;
    IsLast: boolean;
}

export interface MdLogin {
    Msg: string;
    Code: number;
    TradingDay: string;
    LoginTime: string;
    BrokerId: string;
    UserId: string;
    SystemName: string;
    FrontId: number;
    SessionId: number;
    MaxOrderRef: string;
    ShfeTime: string;
    DceTime: string;
    CzceTime: string;
    FfexTime: string;
    IneTime: string;
    SysVersion: string;
    GfexTime: string;
    LoginDRIdentityId: string;
    UserDRIdentityId: string;
    LastLoginTime: string;
    ReserveInfo: string;
    ReqId: number;
    IsLast: boolean;
}

export interface MdLogout {
    BrokerId: string;
    UserId: string;
    ReqId: number;
    IsLast: boolean;
}

export interface MdSubscribe {
    InstrumentId: string;
    ReqId: number;
    IsLast: boolean;
}

export interface MdUnsubscribe {
    InstrumentId: string;
    ReqId: number;
    IsLast: boolean;
}

export interface MdTradingDay {
    TradingDay: string;
    ReqId: number;
    IsLast: boolean;
}

export interface MarketData {
    TradingDay: string;
    InstrumentId: string;
    ExchangeId: string;
    ExchangeInstId: string;
    LastPrice: number;
    PreSettlementPrice: number;
    PreClosePrice: number;
    PreOpenInterest: number;
    OpenPrice: number;
    HighestPrice: number;
    LowestPrice: number;
    Volume: number;
    Turnover: number;
    OpenInterest: number;
    ClosePrice: number;
    SettlementPrice: number;
    UpperLimitPrice: number;
    LowerLimitPrice: number;
    PreDelta: number;
    CurrDelta: number;
    UpdateTime: string;
    UpdateMillisec: number;
    BidPrice1: number;
    BidVolume1: number;
    AskPrice1: number;
    AskVolume1: number;
    BidPrice2: number;
    BidVolume2: number;
    AskPrice2: number;
    AskVolume2: number;
    BidPrice3: number;
    BidVolume3: number;
    AskPrice3: number;
    AskVolume3: number;
    BidPrice4: number;
    BidVolume4: number;
    AskPrice4: number;
    AskVolume4: number;
    BidPrice5: number;
    BidVolume5: number;
    AskPrice5: number;
    AskVolume5: number;
    AveragePrice: number;
    ActionDay: string;
    BandingUpperPrice: number;
    BandingLowerPrice: number;
}

// Trade message interfaces
export interface TradeLogin {
    TradingDay: string;
    LoginTime: string;
    BrokerId: string;
    UserId: string;
    SystemName: string;
    FrontId: number;
    SessionId: number;
    MaxOrderRef: string;
    ShfeTime: string;
    DceTime: string;
    CzceTime: string;
    FfexTime: string;
    IneTime: string;
    SysVersion: string;
    GfexTime: string;
    LoginDRIdentityId: number;
    UserDRIdentityId: number;
    LastLoginTime: string;
    ReqId: number;
    IsLast: boolean;
}

export interface TradeLogout {
    BrokerId: string;
    UserId: string;
    ReqId: number;
    IsLast: boolean;
}

export interface TradeAuthenticate {
    AppId: string;
    AppType: string;
    BrokerId: string;
    UserId: string;
    UserProductInfo: string;
    ReqId: number;
    IsLast: boolean;
}

export interface TradeTradingDay {
    TradingDay: string;
}

export interface TradingAccount {
    BrokerId: string;
    AccountId: string;
    PreMortgage: number;
    PreCredit: number;
    PreDeposit: number;
    PreBalance: number;
    PreMargin: number;
    InterestBase: number;
    Interest: number;
    Deposit: number;
    Withdraw: number;
    FrozenMargin: number;
    FrozenCash: number;
    FrozenCommission: number;
    CurrentMargin: number;
    CashIn: number;
    Commission: number;
    CloseProfit: number;
    PositionProfit: number;
    Available: number;
    WithdrawQuota: number;
    TradingDay: string;
    SettlementId: string;
    Credit: number;
    Mortgage: number;
    ExchangeMargin: number;
    DeliveryMargin: number;
    ExchangeDeliveryMargin: number;
    ReserveBalance: number;
    CurrencyId: string;
    PreFundMortgageIn: number;
    PreFundMortgageOut: number;
    FundMortgageIn: number;
    FundMortgageOut: number;
    FundMortgageAvailable: number;
    MortgageableFund: number;
    SpecProductMargin: number;
    SpecProductFrozenMargin: number;
    SpecProductCommission: number;
    SpecProductFrozenCommission: number;
    SpecProductPositionProfit: number;
    SpecProductCloseProfit: number;
    SpecProductPositionProfitByAlg: number;
    SpecProductExchangeMargin: number;
    BizType: string;
    FrozenSwap: number;
    RemainSwap: number;
    OptionValue: number;
    ReqId: number;
    IsLast: boolean;
}

export interface SettlementInfo {
    TradingDay: string;
    SettlementId: string;
    BrokerId: string;
    InvestorId: string;
    SequenceNo: number;
    Content: string;
    AccountId: string;
    CurrencyId: string;
    ReqId: number;
    IsLast: boolean;
}

export interface SettlementInfoConfirm {
    BrokerId: string;
    InvestorId: string;
    ConfirmDate: string;
    ConfirmTime: string;
    SettlementId: number;
    AccountId: string;
    CurrencyId: string;
    ReqId: number;
    IsLast: boolean;
}

export interface OrderInserted {
    BrokerId: string;
    InvestorId: string;
    UserId: string;
    ExchangeId: string;
    ReqId: number;
    Ref: string;
    OrderLocalId: string;
    OrderSysId: string;
    SequenceNo: number;
    InstrumentId: string;
    InsertDate: string;
    InsertTime: string;
    ActiveTime: string;
    SuspendTime: string;
    UpdateTime: string;
    CancelTime: string;
    OrderSubmitStatus: Flags.OrderSubmitStatus;
    OrderStatus: Flags.OrderStatus;
    VolumeTraded: number;
    VolumeTotal: number;
    StatusMsg: string;
    Direction: Flags.Direction;
    Offset: Flags.OrderOffset;
    PriceType: Flags.OrderPriceType;
    Hedge: Flags.Hedge;
    TimeCondition: Flags.TimeCondition;
}

export interface OrderInsertError {
    AccountId: string;
    UserId: string;
    InvestorId: string;
    BrokerId: string;
    ClientId: string;
    CurrencyId: string;
    ExchangeId: string;
    GTDDate: string;
    InstrumentId: string;
    IsAutoSuspend: boolean;
    IsSwapOrder: boolean;
    LimitPrice: number;
    StopPrice: number;
    VolumeTotalOriginal: number;
    MinVolume: number;
    OrderMemo: string;
    OrderRef: string;
    RequestId: number;
    SessionReqSeq: number;
    Direction: Flags.Direction;
    Offset: Flags.OrderOffset;
    PriceType: Flags.OrderPriceType;
    Hedge: Flags.Hedge;
    TimeCondition: Flags.TimeCondition;
    ReqId: number;
    IsLast: boolean;
}

export interface OrderInsertReturnError {
    AccountId: string;
    UserId: string;
    InvestorId: string;
    BrokerId: string;
    ClientId: string;
    CurrencyId: string;
    ExchangeId: string;
    GTDDate: string;
    InstrumentId: string;
    IsAutoSuspend: boolean;
    IsSwapOrder: boolean;
    LimitPrice: number;
    StopPrice: number;
    VolumeTotalOriginal: number;
    MinVolume: number;
    OrderMemo: string;
    OrderRef: string;
    RequestId: number;
    SessionReqSeq: number;
    Direction: Flags.Direction;
    Offset: Flags.OrderOffset;
    PriceType: Flags.OrderPriceType;
    Hedge: Flags.Hedge;
    TimeCondition: Flags.TimeCondition;
}

export interface OrderDeleted {
    BrokerId: string;
    InvestorId: string;
    UserId: string;
    ExchangeId: string;
    ReqId: number;
    Ref: string;
    OrderLocalId: string;
    OrderSysId: string;
    SequenceNo: number;
    InstrumentId: string;
    InsertDate: string;
    InsertTime: string;
    ActiveTime: string;
    SuspendTime: string;
    UpdateTime: string;
    CancelTime: string;
    OrderSubmitStatus: Flags.OrderSubmitStatus;
    OrderStatus: Flags.OrderStatus;
    VolumeTraded: number;
    VolumeTotal: number;
    StatusMsg: string;
    Direction: Flags.Direction;
    Offset: Flags.OrderOffset;
    PriceType: Flags.OrderPriceType;
    Hedge: Flags.Hedge;
    TimeCondition: Flags.TimeCondition;
}

export interface OrderDeleteError {
    BrokerId: string;
    InvestorId: string;
    OrderActionRef: number;
    OrderRef: string;
    RequestId: number;
    FrontId: number;
    SessionId: number;
    ExchangeId: string;
    OrderSysId: string;
    ActionFlag: string;
    LimitPrice: number;
    VolumeChange: number;
    UserId: string;
    InvestUnitId: string;
    MacAddress: string;
    InstrumentId: string;
    IPAddress: string;
    OrderMemo: string;
    SessionReqSeq: number;
    ReqId: number;
    IsLast: boolean;
}

export interface OrderDeleteReturnError {
    BrokerId: string;
    InvestorId: string;
    OrderActionRef: number;
    OrderRef: string;
    RequestId: number;
    FrontId: number;
    SessionId: number;
    ExchangeId: string;
    OrderSysId: string;
    ActionFlag: string;
    LimitPrice: number;
    VolumeChange: number;
    ActionDate: string;
    ActionTime: string;
    TraderId: string;
    InstallId: number;
    OrderLocalId: string;
    ActionLocalId: string;
    ParticipantId: string;
    ClientId: string;
    BusinessUnit: string;
    OrderActionStatus: string;
    UserId: string;
    StatusMsg: string;
    BranchId: string;
    InvestUnitId: string;
    MacAddress: string;
    InstrumentId: string;
    IPAddress: string;
    OrderMemo: string;
    SessionReqSeq: number;
}

export interface OrderTraded {
    BrokerId: string;
    InvestorId: string;
    UserId: string;
    ExchangeId: string;
    TradeId: string;
    OrderSysId: string;
    OrderLocalId: string;
    BrokerOrderSeq: string;
    SettlementId: string;
    Volume: number;
    Direction: Flags.Direction;
    Offset: Flags.OrderOffset;
    Hedge: Flags.Hedge;
}

export interface QueryOrder {
    BrokerId: string;
    InvestorId: string;
    UserId: string;
    ExchangeId: string;
    RequestId: number;
    Ref: string;
    OrderLocalId: string;
    OrderSysId: string;
    SequenceNo: number;
    InstrumentId: string;
    InsertDate: string;
    InsertTime: string;
    ActiveTime: string;
    SuspendTime: string;
    UpdateTime: string;
    CancelTime: string;
    OrderSubmitStatus: Flags.OrderSubmitStatus;
    OrderStatus: Flags.OrderStatus;
    VolumeTraded: number;
    VolumeTotal: number;
    StatusMsg: string;
    Direction: Flags.Direction;
    Offset: Flags.OrderOffset;
    PriceType: Flags.OrderPriceType;
    Hedge: Flags.Hedge;
    TimeCondition: Flags.TimeCondition;
    ReqId: number;
    IsLast: boolean;
}

export interface Instrument {
    RequestId: number;
    IsLast: boolean;
    ExchangeId: string;
    InstrumentName: string;
    ProductClass: string;
    DeliveryYear: number;
    DeliveryMonth: number;
    MaxMarketOrderVolume: number;
    MinMarketOrderVolume: number;
    MaxLimitOrderVolume: number;
    MinLimitOrderVolume: number;
    VolumeMultiple: number;
    PriceTick: number;
    CreateDate: string;
    OpenDate: string;
    ExpireDate: string;
    StartDelivDate: string;
    EndDelivDate: string;
    InstLifePhase: string;
    IsTrading: number;
    PositionType: string;
    PositionDateType: string;
    LongMarginRatio: number;
    ShortMarginRatio: number;
    MaxMarginSideAlgorithm: string;
    StrikePrice: number;
    OptionsType: string;
    UnderlyingMultiple: number;
    CombinationType: string;
    InstrumentId: string;
    ExchangeInstId: string;
    ProductId: string;
    UnderlyingInstrId: string;
}
