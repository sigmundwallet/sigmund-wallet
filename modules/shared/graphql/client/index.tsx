import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
const defaultOptions = {} as const;

      export interface PossibleTypesResultData {
        possibleTypes: {
          [key: string]: string[]
        }
      }
      const result: PossibleTypesResultData = {
  "possibleTypes": {}
};
      export default result;
    
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** The `BigInt` scalar type represents non-fractional signed whole numeric values. */
  BigInt: number;
  /** A date string, such as 2007-12-03, compliant with the `full-date` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  Date: Date;
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  DateTime: Date;
};

export type Account = {
  __typename?: 'Account';
  bitcoinPaymentRequests: Array<BitcoinPaymentRequest>;
  index: Scalars['Int'];
  name: Scalars['String'];
  payLink?: Maybe<Scalars['String']>;
  receiveBitcoinAddress?: Maybe<Scalars['String']>;
  wallet: Wallet;
  walletId: Scalars['String'];
};


export type AccountReceiveBitcoinAddressArgs = {
  accountIndex?: InputMaybe<Scalars['Int']>;
};

export type BitcoinAddress = {
  __typename?: 'BitcoinAddress';
  account: Account;
  address: Scalars['ID'];
  bitcoinOutputs: Array<BitcoinOutput>;
  change: Scalars['Boolean'];
  label?: Maybe<Scalars['String']>;
  lastStatus?: Maybe<Scalars['String']>;
  scripthash: Scalars['String'];
};

export type BitcoinChainInfo = {
  __typename?: 'BitcoinChainInfo';
  feeRates: Array<Scalars['Float']>;
  id: Scalars['String'];
  lastBlock: Scalars['Int'];
  updatedAt: Scalars['DateTime'];
  usdPrice?: Maybe<Scalars['Float']>;
};

export type BitcoinKey = {
  __typename?: 'BitcoinKey';
  derivationPath: Scalars['String'];
  id: Scalars['ID'];
  masterFingerprint: Scalars['String'];
  publicKey: Scalars['String'];
  walletType: Scalars['String'];
};

export type BitcoinOutput = {
  __typename?: 'BitcoinOutput';
  bitcoinAddress: BitcoinAddress;
  bitcoinTransaction: BitcoinTransaction;
  id: Scalars['ID'];
  scriptHash: Scalars['String'];
  spentInTransaction: BitcoinTransaction;
  txHash: Scalars['String'];
  txPos: Scalars['Int'];
  value: Scalars['BigInt'];
};

export type BitcoinPaymentRequest = {
  __typename?: 'BitcoinPaymentRequest';
  account: Account;
  address: Scalars['String'];
  amount: Scalars['BigInt'];
  fee: Scalars['BigInt'];
  id: Scalars['ID'];
  memo?: Maybe<Scalars['String']>;
  psbt?: Maybe<Scalars['String']>;
  signRequest?: Maybe<PlatformKeySignRequest>;
  signedWithKeys: Array<Key>;
  transaction?: Maybe<BitcoinTransaction>;
};

export type BitcoinTransaction = {
  __typename?: 'BitcoinTransaction';
  blockTimestamp?: Maybe<Scalars['DateTime']>;
  error?: Maybe<Scalars['String']>;
  height?: Maybe<Scalars['Int']>;
  inputs: Array<BitcoinOutput>;
  label?: Maybe<Scalars['String']>;
  locktime: Scalars['BigInt'];
  outputs: Array<BitcoinOutput>;
  source: BitcoinTransactionSource;
  txHash: Scalars['ID'];
  version: Scalars['Int'];
};

export enum BitcoinTransactionSource {
  App = 'APP',
  Block = 'BLOCK',
  Mempool = 'MEMPOOL'
}

export type BitcoinWalletBalance = {
  __typename?: 'BitcoinWalletBalance';
  confirmed: Scalars['BigInt'];
  unconfirmed: Scalars['BigInt'];
};

export enum BlockchainType {
  Bitcoin = 'Bitcoin',
  BitcoinRegtest = 'BitcoinRegtest',
  BitcoinTestnet = 'BitcoinTestnet',
  Liquid = 'Liquid'
}

export type Key = {
  __typename?: 'Key';
  blockchainType: BlockchainType;
  id: Scalars['ID'];
  lastVerifiedAt: Scalars['DateTime'];
  name?: Maybe<Scalars['String']>;
  ownershipType: KeyOwnershipType;
  signatures?: Maybe<Array<SignMessageRequest>>;
  walletId: Scalars['String'];
};

export enum KeyOwnershipType {
  Platform = 'PLATFORM',
  User = 'USER'
}

export type Mutation = {
  __typename?: 'Mutation';
  broadcastBitcoinPaymentRequest: BitcoinPaymentRequest;
  confirmPlatformKeySignRequest: PlatformKeySignRequest;
  createAccount: Account;
  createBitcoinPaymentRequest: BitcoinPaymentRequest;
  createPlatformKeySignRequest: PlatformKeySignRequest;
  createSignMessageRequest: PartialSignMessageRequest;
  deletePlatformKeySignRequest: Scalars['Boolean'];
  removeBitcoinPaymentRequest: Scalars['Boolean'];
  setTransactionLabel: BitcoinTransaction;
  signMessage: Scalars['Boolean'];
  updateAccount: Account;
  updateBitcoinPaymentRequest: BitcoinPaymentRequest;
  updatePlatformKey: PartialPlatformKey;
};


export type MutationBroadcastBitcoinPaymentRequestArgs = {
  id: Scalars['String'];
};


export type MutationConfirmPlatformKeySignRequestArgs = {
  id: Scalars['String'];
  verification: Array<Scalars['String']>;
};


export type MutationCreateAccountArgs = {
  name?: InputMaybe<Scalars['String']>;
  walletId: Scalars['String'];
};


export type MutationCreateBitcoinPaymentRequestArgs = {
  accountIndex: Scalars['Int'];
  address: Scalars['String'];
  amount: Scalars['BigInt'];
  feeRate: Scalars['Float'];
  maxOut?: InputMaybe<Scalars['Boolean']>;
  memo?: InputMaybe<Scalars['String']>;
  walletId: Scalars['String'];
};


export type MutationCreatePlatformKeySignRequestArgs = {
  bitcoinPaymentRequestId?: InputMaybe<Scalars['String']>;
  keyId: Scalars['String'];
};


export type MutationDeletePlatformKeySignRequestArgs = {
  id: Scalars['String'];
};


export type MutationRemoveBitcoinPaymentRequestArgs = {
  id: Scalars['String'];
};


export type MutationSetTransactionLabelArgs = {
  label: Scalars['String'];
  txHash: Scalars['String'];
};


export type MutationSignMessageArgs = {
  keyId?: InputMaybe<Scalars['String']>;
  msg: Scalars['String'];
  signature: Scalars['String'];
};


export type MutationUpdateAccountArgs = {
  index: Scalars['Int'];
  name?: InputMaybe<Scalars['String']>;
  payLink?: InputMaybe<Scalars['String']>;
  walletId: Scalars['String'];
};


export type MutationUpdateBitcoinPaymentRequestArgs = {
  id: Scalars['String'];
  memo?: InputMaybe<Scalars['String']>;
  psbt?: InputMaybe<Scalars['String']>;
};


export type MutationUpdatePlatformKeyArgs = {
  input: UpdatePlatformKeyInput;
};

export type PartialPlatformKey = {
  __typename?: 'PartialPlatformKey';
  id: Scalars['String'];
  quizQuestions: Array<Scalars['String']>;
  verificationPediod: Scalars['Int'];
  verificationType: PlatformKeyVerificationType;
};

export type PartialSession = {
  __typename?: 'PartialSession';
  expiresAt?: Maybe<Scalars['DateTime']>;
  id: Scalars['ID'];
  signMessageRequests: Array<SignMessageRequest>;
  walletId: Scalars['ID'];
};

export type PartialSignMessageRequest = {
  __typename?: 'PartialSignMessageRequest';
  derivationPath: Scalars['String'];
  id: Scalars['ID'];
};

export type PlatformKey = {
  __typename?: 'PlatformKey';
  id: Scalars['ID'];
  quizQuestions: Array<Scalars['String']>;
  verificationPediod: Scalars['Int'];
  verificationType: PlatformKeyVerificationType;
};

export type PlatformKeyBilling = {
  __typename?: 'PlatformKeyBilling';
  amountPaid: Scalars['Int'];
  basePrice: Scalars['Int'];
  createdAt: Scalars['DateTime'];
  discountPrice: Scalars['Int'];
  id: Scalars['ID'];
  monthsPaid: Scalars['Int'];
};

export type PlatformKeyBillingSummary = {
  __typename?: 'PlatformKeyBillingSummary';
  billing: Array<PlatformKeyBilling>;
  billingAddress: Scalars['String'];
  keyId: Scalars['ID'];
  paidUntil: Scalars['DateTime'];
};

export type PlatformKeySignRequest = {
  __typename?: 'PlatformKeySignRequest';
  expiresAt: Scalars['DateTime'];
  id: Scalars['ID'];
  isExpired: Scalars['Boolean'];
  platformKey: PartialPlatformKey;
  signedAt?: Maybe<Scalars['DateTime']>;
  willSignAt?: Maybe<Scalars['DateTime']>;
};

export enum PlatformKeyVerificationType {
  Email = 'EMAIL',
  Quiz = 'QUIZ',
  Sms = 'SMS'
}

export type Query = {
  __typename?: 'Query';
  bitcoinChainInfo: BitcoinChainInfo;
  bitcoinKey: BitcoinKey;
  bitcoinPaymentRequest: BitcoinPaymentRequest;
  bitcoinWalletBalance: BitcoinWalletBalance;
  key: Key;
  platformKey: PartialPlatformKey;
  platformKeyBilling: PlatformKeyBillingSummary;
  recoveryInfo: Array<RecoveryInfoItem>;
  session?: Maybe<PartialSession>;
  transaction?: Maybe<BitcoinTransaction>;
  wallet: Wallet;
  walletTransactions: Array<BitcoinTransaction>;
};


export type QueryBitcoinKeyArgs = {
  keyId: Scalars['String'];
};


export type QueryBitcoinPaymentRequestArgs = {
  id: Scalars['String'];
};


export type QueryBitcoinWalletBalanceArgs = {
  accountIndex: Scalars['Int'];
  walletId: Scalars['String'];
};


export type QueryKeyArgs = {
  keyId: Scalars['String'];
};


export type QueryPlatformKeyArgs = {
  keyId: Scalars['String'];
};


export type QueryPlatformKeyBillingArgs = {
  keyId: Scalars['String'];
};


export type QueryRecoveryInfoArgs = {
  accountIndex: Scalars['Int'];
  walletId: Scalars['String'];
};


export type QueryTransactionArgs = {
  txHash: Scalars['String'];
};


export type QueryWalletArgs = {
  id: Scalars['String'];
};


export type QueryWalletTransactionsArgs = {
  accountIndex: Scalars['Int'];
  walletId: Scalars['String'];
};

export type RecoveryInfoItem = {
  __typename?: 'RecoveryInfoItem';
  derivationPath: Scalars['String'];
  masterFingerprint: Scalars['String'];
  publicKey: Scalars['ID'];
  type: Scalars['String'];
  walletType: Scalars['String'];
};

export type SignMessageRequest = {
  __typename?: 'SignMessageRequest';
  expiresAt: Scalars['DateTime'];
  id: Scalars['ID'];
  signedWith?: Maybe<Scalars['String']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  bitcoinChainInfo: BitcoinChainInfo;
  bitcoinWalletBalance: BitcoinWalletBalance;
};


export type SubscriptionBitcoinWalletBalanceArgs = {
  accountIndex: Scalars['Int'];
  walletId: Scalars['String'];
};

export type UpdatePlatformKeyInput = {
  keyId: Scalars['String'];
  quizAnswers: Array<Scalars['String']>;
  quizQuestions: Array<Scalars['String']>;
  verificationPediod: Scalars['Int'];
};

export type UserKey = {
  __typename?: 'UserKey';
  id: Scalars['ID'];
};

export type Wallet = {
  __typename?: 'Wallet';
  accounts: Array<Account>;
  id: Scalars['ID'];
  keys: Array<Key>;
  name: Scalars['String'];
  threshold: Scalars['Int'];
  type: BlockchainType;
};

export const PlatformKeySignRequestSharedFragmentDoc = gql`
    fragment PlatformKeySignRequestShared on PlatformKeySignRequest {
  id
  platformKey {
    verificationType
    quizQuestions
  }
  willSignAt
  signedAt
  expiresAt
  isExpired
}
    `;
export const BitcoinPaymentRequestSharedFragmentDoc = gql`
    fragment BitcoinPaymentRequestShared on BitcoinPaymentRequest {
  id
  address
  amount
  fee
  memo
  psbt
  signedWithKeys {
    id
    name
    ownershipType
  }
  signRequest {
    ...PlatformKeySignRequestShared
  }
  transaction {
    txHash
    source
    error
  }
}
    ${PlatformKeySignRequestSharedFragmentDoc}`;
export const GetBitcoinKeyDocument = gql`
    query GetBitcoinKey($keyId: String!) {
  bitcoinKey(keyId: $keyId) {
    id
    derivationPath
    masterFingerprint
    publicKey
    walletType
  }
}
    `;

/**
 * __useGetBitcoinKeyQuery__
 *
 * To run a query within a React component, call `useGetBitcoinKeyQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetBitcoinKeyQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetBitcoinKeyQuery({
 *   variables: {
 *      keyId: // value for 'keyId'
 *   },
 * });
 */
export function useGetBitcoinKeyQuery(baseOptions: Apollo.QueryHookOptions<GetBitcoinKeyQuery, GetBitcoinKeyQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetBitcoinKeyQuery, GetBitcoinKeyQueryVariables>(GetBitcoinKeyDocument, options);
      }
export function useGetBitcoinKeyLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetBitcoinKeyQuery, GetBitcoinKeyQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetBitcoinKeyQuery, GetBitcoinKeyQueryVariables>(GetBitcoinKeyDocument, options);
        }
export type GetBitcoinKeyQueryHookResult = ReturnType<typeof useGetBitcoinKeyQuery>;
export type GetBitcoinKeyLazyQueryHookResult = ReturnType<typeof useGetBitcoinKeyLazyQuery>;
export type GetBitcoinKeyQueryResult = Apollo.QueryResult<GetBitcoinKeyQuery, GetBitcoinKeyQueryVariables>;
export const GetKeyDocument = gql`
    query GetKey($keyId: String!) {
  key(keyId: $keyId) {
    id
    walletId
    lastVerifiedAt
    name
    ownershipType
    blockchainType
    signatures {
      expiresAt
      id
      signedWith
    }
  }
}
    `;

/**
 * __useGetKeyQuery__
 *
 * To run a query within a React component, call `useGetKeyQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetKeyQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetKeyQuery({
 *   variables: {
 *      keyId: // value for 'keyId'
 *   },
 * });
 */
export function useGetKeyQuery(baseOptions: Apollo.QueryHookOptions<GetKeyQuery, GetKeyQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetKeyQuery, GetKeyQueryVariables>(GetKeyDocument, options);
      }
export function useGetKeyLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetKeyQuery, GetKeyQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetKeyQuery, GetKeyQueryVariables>(GetKeyDocument, options);
        }
export type GetKeyQueryHookResult = ReturnType<typeof useGetKeyQuery>;
export type GetKeyLazyQueryHookResult = ReturnType<typeof useGetKeyLazyQuery>;
export type GetKeyQueryResult = Apollo.QueryResult<GetKeyQuery, GetKeyQueryVariables>;
export const GetPlatformKeyBillingDocument = gql`
    query GetPlatformKeyBilling($keyId: String!) {
  platformKeyBilling(keyId: $keyId) {
    keyId
    billingAddress
    paidUntil
    billing {
      amountPaid
      basePrice
      createdAt
      discountPrice
      id
      monthsPaid
    }
  }
}
    `;

/**
 * __useGetPlatformKeyBillingQuery__
 *
 * To run a query within a React component, call `useGetPlatformKeyBillingQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPlatformKeyBillingQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPlatformKeyBillingQuery({
 *   variables: {
 *      keyId: // value for 'keyId'
 *   },
 * });
 */
export function useGetPlatformKeyBillingQuery(baseOptions: Apollo.QueryHookOptions<GetPlatformKeyBillingQuery, GetPlatformKeyBillingQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetPlatformKeyBillingQuery, GetPlatformKeyBillingQueryVariables>(GetPlatformKeyBillingDocument, options);
      }
export function useGetPlatformKeyBillingLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetPlatformKeyBillingQuery, GetPlatformKeyBillingQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetPlatformKeyBillingQuery, GetPlatformKeyBillingQueryVariables>(GetPlatformKeyBillingDocument, options);
        }
export type GetPlatformKeyBillingQueryHookResult = ReturnType<typeof useGetPlatformKeyBillingQuery>;
export type GetPlatformKeyBillingLazyQueryHookResult = ReturnType<typeof useGetPlatformKeyBillingLazyQuery>;
export type GetPlatformKeyBillingQueryResult = Apollo.QueryResult<GetPlatformKeyBillingQuery, GetPlatformKeyBillingQueryVariables>;
export const UpdatePlatformKeyDocument = gql`
    mutation UpdatePlatformKey($input: UpdatePlatformKeyInput!) {
  updatePlatformKey(input: $input) {
    id
    quizQuestions
    verificationPediod
    verificationType
  }
}
    `;
export type UpdatePlatformKeyMutationFn = Apollo.MutationFunction<UpdatePlatformKeyMutation, UpdatePlatformKeyMutationVariables>;

/**
 * __useUpdatePlatformKeyMutation__
 *
 * To run a mutation, you first call `useUpdatePlatformKeyMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdatePlatformKeyMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updatePlatformKeyMutation, { data, loading, error }] = useUpdatePlatformKeyMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useUpdatePlatformKeyMutation(baseOptions?: Apollo.MutationHookOptions<UpdatePlatformKeyMutation, UpdatePlatformKeyMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdatePlatformKeyMutation, UpdatePlatformKeyMutationVariables>(UpdatePlatformKeyDocument, options);
      }
export type UpdatePlatformKeyMutationHookResult = ReturnType<typeof useUpdatePlatformKeyMutation>;
export type UpdatePlatformKeyMutationResult = Apollo.MutationResult<UpdatePlatformKeyMutation>;
export type UpdatePlatformKeyMutationOptions = Apollo.BaseMutationOptions<UpdatePlatformKeyMutation, UpdatePlatformKeyMutationVariables>;
export const GetSessionDocument = gql`
    query GetSession {
  session {
    expiresAt
    id
    signMessageRequests {
      expiresAt
      id
      signedWith
    }
    walletId
  }
}
    `;

/**
 * __useGetSessionQuery__
 *
 * To run a query within a React component, call `useGetSessionQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSessionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSessionQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetSessionQuery(baseOptions?: Apollo.QueryHookOptions<GetSessionQuery, GetSessionQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetSessionQuery, GetSessionQueryVariables>(GetSessionDocument, options);
      }
export function useGetSessionLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetSessionQuery, GetSessionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetSessionQuery, GetSessionQueryVariables>(GetSessionDocument, options);
        }
export type GetSessionQueryHookResult = ReturnType<typeof useGetSessionQuery>;
export type GetSessionLazyQueryHookResult = ReturnType<typeof useGetSessionLazyQuery>;
export type GetSessionQueryResult = Apollo.QueryResult<GetSessionQuery, GetSessionQueryVariables>;
export const GetRecoveryInfoDocument = gql`
    query GetRecoveryInfo($accountIndex: Int!, $walletId: String!) {
  recoveryInfo(accountIndex: $accountIndex, walletId: $walletId) {
    type
    publicKey
    derivationPath
    masterFingerprint
    walletType
  }
}
    `;

/**
 * __useGetRecoveryInfoQuery__
 *
 * To run a query within a React component, call `useGetRecoveryInfoQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetRecoveryInfoQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetRecoveryInfoQuery({
 *   variables: {
 *      accountIndex: // value for 'accountIndex'
 *      walletId: // value for 'walletId'
 *   },
 * });
 */
export function useGetRecoveryInfoQuery(baseOptions: Apollo.QueryHookOptions<GetRecoveryInfoQuery, GetRecoveryInfoQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetRecoveryInfoQuery, GetRecoveryInfoQueryVariables>(GetRecoveryInfoDocument, options);
      }
export function useGetRecoveryInfoLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetRecoveryInfoQuery, GetRecoveryInfoQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetRecoveryInfoQuery, GetRecoveryInfoQueryVariables>(GetRecoveryInfoDocument, options);
        }
export type GetRecoveryInfoQueryHookResult = ReturnType<typeof useGetRecoveryInfoQuery>;
export type GetRecoveryInfoLazyQueryHookResult = ReturnType<typeof useGetRecoveryInfoLazyQuery>;
export type GetRecoveryInfoQueryResult = Apollo.QueryResult<GetRecoveryInfoQuery, GetRecoveryInfoQueryVariables>;
export const CreateAccountDocument = gql`
    mutation createAccount($walletId: String!, $name: String) {
  createAccount(walletId: $walletId, name: $name) {
    walletId
    index
    name
    receiveBitcoinAddress
  }
}
    `;
export type CreateAccountMutationFn = Apollo.MutationFunction<CreateAccountMutation, CreateAccountMutationVariables>;

/**
 * __useCreateAccountMutation__
 *
 * To run a mutation, you first call `useCreateAccountMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateAccountMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createAccountMutation, { data, loading, error }] = useCreateAccountMutation({
 *   variables: {
 *      walletId: // value for 'walletId'
 *      name: // value for 'name'
 *   },
 * });
 */
export function useCreateAccountMutation(baseOptions?: Apollo.MutationHookOptions<CreateAccountMutation, CreateAccountMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateAccountMutation, CreateAccountMutationVariables>(CreateAccountDocument, options);
      }
export type CreateAccountMutationHookResult = ReturnType<typeof useCreateAccountMutation>;
export type CreateAccountMutationResult = Apollo.MutationResult<CreateAccountMutation>;
export type CreateAccountMutationOptions = Apollo.BaseMutationOptions<CreateAccountMutation, CreateAccountMutationVariables>;
export const StreamBitcoinChainInfoDocument = gql`
    subscription StreamBitcoinChainInfo {
  bitcoinChainInfo {
    updatedAt
    feeRates
    id
    usdPrice
  }
}
    `;

/**
 * __useStreamBitcoinChainInfoSubscription__
 *
 * To run a query within a React component, call `useStreamBitcoinChainInfoSubscription` and pass it any options that fit your needs.
 * When your component renders, `useStreamBitcoinChainInfoSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useStreamBitcoinChainInfoSubscription({
 *   variables: {
 *   },
 * });
 */
export function useStreamBitcoinChainInfoSubscription(baseOptions?: Apollo.SubscriptionHookOptions<StreamBitcoinChainInfoSubscription, StreamBitcoinChainInfoSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useSubscription<StreamBitcoinChainInfoSubscription, StreamBitcoinChainInfoSubscriptionVariables>(StreamBitcoinChainInfoDocument, options);
      }
export type StreamBitcoinChainInfoSubscriptionHookResult = ReturnType<typeof useStreamBitcoinChainInfoSubscription>;
export type StreamBitcoinChainInfoSubscriptionResult = Apollo.SubscriptionResult<StreamBitcoinChainInfoSubscription>;
export const GetBitcoinChainInfoDocument = gql`
    query GetBitcoinChainInfo {
  bitcoinChainInfo {
    updatedAt
    feeRates
    id
    usdPrice
    lastBlock
  }
}
    `;

/**
 * __useGetBitcoinChainInfoQuery__
 *
 * To run a query within a React component, call `useGetBitcoinChainInfoQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetBitcoinChainInfoQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetBitcoinChainInfoQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetBitcoinChainInfoQuery(baseOptions?: Apollo.QueryHookOptions<GetBitcoinChainInfoQuery, GetBitcoinChainInfoQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetBitcoinChainInfoQuery, GetBitcoinChainInfoQueryVariables>(GetBitcoinChainInfoDocument, options);
      }
export function useGetBitcoinChainInfoLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetBitcoinChainInfoQuery, GetBitcoinChainInfoQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetBitcoinChainInfoQuery, GetBitcoinChainInfoQueryVariables>(GetBitcoinChainInfoDocument, options);
        }
export type GetBitcoinChainInfoQueryHookResult = ReturnType<typeof useGetBitcoinChainInfoQuery>;
export type GetBitcoinChainInfoLazyQueryHookResult = ReturnType<typeof useGetBitcoinChainInfoLazyQuery>;
export type GetBitcoinChainInfoQueryResult = Apollo.QueryResult<GetBitcoinChainInfoQuery, GetBitcoinChainInfoQueryVariables>;
export const GetTransactionDocument = gql`
    query GetTransaction($txHash: String!) {
  transaction(txHash: $txHash) {
    height
    txHash
    blockTimestamp
    inputs {
      txPos
      value
      spentInTransaction {
        blockTimestamp
        outputs {
          value
          bitcoinAddress {
            address
            account {
              walletId
              index
            }
          }
        }
      }
    }
    outputs {
      value
      bitcoinAddress {
        address
        account {
          walletId
          index
        }
      }
    }
  }
}
    `;

/**
 * __useGetTransactionQuery__
 *
 * To run a query within a React component, call `useGetTransactionQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTransactionQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTransactionQuery({
 *   variables: {
 *      txHash: // value for 'txHash'
 *   },
 * });
 */
export function useGetTransactionQuery(baseOptions: Apollo.QueryHookOptions<GetTransactionQuery, GetTransactionQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetTransactionQuery, GetTransactionQueryVariables>(GetTransactionDocument, options);
      }
export function useGetTransactionLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetTransactionQuery, GetTransactionQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetTransactionQuery, GetTransactionQueryVariables>(GetTransactionDocument, options);
        }
export type GetTransactionQueryHookResult = ReturnType<typeof useGetTransactionQuery>;
export type GetTransactionLazyQueryHookResult = ReturnType<typeof useGetTransactionLazyQuery>;
export type GetTransactionQueryResult = Apollo.QueryResult<GetTransactionQuery, GetTransactionQueryVariables>;
export const GetWalletDocument = gql`
    query GetWallet($id: String!) {
  wallet(id: $id) {
    id
    name
    type
    threshold
    accounts {
      walletId
      index
      name
      payLink
      receiveBitcoinAddress
      bitcoinPaymentRequests {
        id
        amount
        address
        memo
      }
    }
    keys {
      id
      ownershipType
      lastVerifiedAt
      name
      signatures {
        id
        expiresAt
      }
    }
  }
}
    `;

/**
 * __useGetWalletQuery__
 *
 * To run a query within a React component, call `useGetWalletQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetWalletQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetWalletQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetWalletQuery(baseOptions: Apollo.QueryHookOptions<GetWalletQuery, GetWalletQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetWalletQuery, GetWalletQueryVariables>(GetWalletDocument, options);
      }
export function useGetWalletLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetWalletQuery, GetWalletQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetWalletQuery, GetWalletQueryVariables>(GetWalletDocument, options);
        }
export type GetWalletQueryHookResult = ReturnType<typeof useGetWalletQuery>;
export type GetWalletLazyQueryHookResult = ReturnType<typeof useGetWalletLazyQuery>;
export type GetWalletQueryResult = Apollo.QueryResult<GetWalletQuery, GetWalletQueryVariables>;
export const GetWalletBalanceDocument = gql`
    subscription GetWalletBalance($walletId: String!, $accountIndex: Int!) {
  bitcoinWalletBalance(walletId: $walletId, accountIndex: $accountIndex) {
    confirmed
    unconfirmed
  }
}
    `;

/**
 * __useGetWalletBalanceSubscription__
 *
 * To run a query within a React component, call `useGetWalletBalanceSubscription` and pass it any options that fit your needs.
 * When your component renders, `useGetWalletBalanceSubscription` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the subscription, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetWalletBalanceSubscription({
 *   variables: {
 *      walletId: // value for 'walletId'
 *      accountIndex: // value for 'accountIndex'
 *   },
 * });
 */
export function useGetWalletBalanceSubscription(baseOptions: Apollo.SubscriptionHookOptions<GetWalletBalanceSubscription, GetWalletBalanceSubscriptionVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useSubscription<GetWalletBalanceSubscription, GetWalletBalanceSubscriptionVariables>(GetWalletBalanceDocument, options);
      }
export type GetWalletBalanceSubscriptionHookResult = ReturnType<typeof useGetWalletBalanceSubscription>;
export type GetWalletBalanceSubscriptionResult = Apollo.SubscriptionResult<GetWalletBalanceSubscription>;
export const GetWalletBalanceQueryDocument = gql`
    query GetWalletBalanceQuery($walletId: String!, $accountIndex: Int!) {
  bitcoinWalletBalance(walletId: $walletId, accountIndex: $accountIndex) {
    confirmed
    unconfirmed
  }
}
    `;

/**
 * __useGetWalletBalanceQueryQuery__
 *
 * To run a query within a React component, call `useGetWalletBalanceQueryQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetWalletBalanceQueryQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetWalletBalanceQueryQuery({
 *   variables: {
 *      walletId: // value for 'walletId'
 *      accountIndex: // value for 'accountIndex'
 *   },
 * });
 */
export function useGetWalletBalanceQueryQuery(baseOptions: Apollo.QueryHookOptions<GetWalletBalanceQueryQuery, GetWalletBalanceQueryQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetWalletBalanceQueryQuery, GetWalletBalanceQueryQueryVariables>(GetWalletBalanceQueryDocument, options);
      }
export function useGetWalletBalanceQueryLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetWalletBalanceQueryQuery, GetWalletBalanceQueryQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetWalletBalanceQueryQuery, GetWalletBalanceQueryQueryVariables>(GetWalletBalanceQueryDocument, options);
        }
export type GetWalletBalanceQueryQueryHookResult = ReturnType<typeof useGetWalletBalanceQueryQuery>;
export type GetWalletBalanceQueryLazyQueryHookResult = ReturnType<typeof useGetWalletBalanceQueryLazyQuery>;
export type GetWalletBalanceQueryQueryResult = Apollo.QueryResult<GetWalletBalanceQueryQuery, GetWalletBalanceQueryQueryVariables>;
export const GetWalletTransactionsDocument = gql`
    query GetWalletTransactions($walletId: String!, $accountIndex: Int!) {
  walletTransactions(walletId: $walletId, accountIndex: $accountIndex) {
    height
    txHash
    blockTimestamp
    label
    inputs {
      txPos
      value
      bitcoinAddress {
        address
        account {
          walletId
          index
        }
      }
    }
    outputs {
      value
      bitcoinAddress {
        address
        account {
          walletId
          index
        }
      }
    }
  }
}
    `;

/**
 * __useGetWalletTransactionsQuery__
 *
 * To run a query within a React component, call `useGetWalletTransactionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetWalletTransactionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetWalletTransactionsQuery({
 *   variables: {
 *      walletId: // value for 'walletId'
 *      accountIndex: // value for 'accountIndex'
 *   },
 * });
 */
export function useGetWalletTransactionsQuery(baseOptions: Apollo.QueryHookOptions<GetWalletTransactionsQuery, GetWalletTransactionsQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetWalletTransactionsQuery, GetWalletTransactionsQueryVariables>(GetWalletTransactionsDocument, options);
      }
export function useGetWalletTransactionsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetWalletTransactionsQuery, GetWalletTransactionsQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetWalletTransactionsQuery, GetWalletTransactionsQueryVariables>(GetWalletTransactionsDocument, options);
        }
export type GetWalletTransactionsQueryHookResult = ReturnType<typeof useGetWalletTransactionsQuery>;
export type GetWalletTransactionsLazyQueryHookResult = ReturnType<typeof useGetWalletTransactionsLazyQuery>;
export type GetWalletTransactionsQueryResult = Apollo.QueryResult<GetWalletTransactionsQuery, GetWalletTransactionsQueryVariables>;
export const RemoveBitcoinPaymentRequestDocument = gql`
    mutation RemoveBitcoinPaymentRequest($id: String!) {
  removeBitcoinPaymentRequest(id: $id)
}
    `;
export type RemoveBitcoinPaymentRequestMutationFn = Apollo.MutationFunction<RemoveBitcoinPaymentRequestMutation, RemoveBitcoinPaymentRequestMutationVariables>;

/**
 * __useRemoveBitcoinPaymentRequestMutation__
 *
 * To run a mutation, you first call `useRemoveBitcoinPaymentRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRemoveBitcoinPaymentRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [removeBitcoinPaymentRequestMutation, { data, loading, error }] = useRemoveBitcoinPaymentRequestMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useRemoveBitcoinPaymentRequestMutation(baseOptions?: Apollo.MutationHookOptions<RemoveBitcoinPaymentRequestMutation, RemoveBitcoinPaymentRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RemoveBitcoinPaymentRequestMutation, RemoveBitcoinPaymentRequestMutationVariables>(RemoveBitcoinPaymentRequestDocument, options);
      }
export type RemoveBitcoinPaymentRequestMutationHookResult = ReturnType<typeof useRemoveBitcoinPaymentRequestMutation>;
export type RemoveBitcoinPaymentRequestMutationResult = Apollo.MutationResult<RemoveBitcoinPaymentRequestMutation>;
export type RemoveBitcoinPaymentRequestMutationOptions = Apollo.BaseMutationOptions<RemoveBitcoinPaymentRequestMutation, RemoveBitcoinPaymentRequestMutationVariables>;
export const SetTransactionLabelDocument = gql`
    mutation SetTransactionLabel($txHash: String!, $label: String!) {
  setTransactionLabel(txHash: $txHash, label: $label) {
    txHash
    label
  }
}
    `;
export type SetTransactionLabelMutationFn = Apollo.MutationFunction<SetTransactionLabelMutation, SetTransactionLabelMutationVariables>;

/**
 * __useSetTransactionLabelMutation__
 *
 * To run a mutation, you first call `useSetTransactionLabelMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSetTransactionLabelMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [setTransactionLabelMutation, { data, loading, error }] = useSetTransactionLabelMutation({
 *   variables: {
 *      txHash: // value for 'txHash'
 *      label: // value for 'label'
 *   },
 * });
 */
export function useSetTransactionLabelMutation(baseOptions?: Apollo.MutationHookOptions<SetTransactionLabelMutation, SetTransactionLabelMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SetTransactionLabelMutation, SetTransactionLabelMutationVariables>(SetTransactionLabelDocument, options);
      }
export type SetTransactionLabelMutationHookResult = ReturnType<typeof useSetTransactionLabelMutation>;
export type SetTransactionLabelMutationResult = Apollo.MutationResult<SetTransactionLabelMutation>;
export type SetTransactionLabelMutationOptions = Apollo.BaseMutationOptions<SetTransactionLabelMutation, SetTransactionLabelMutationVariables>;
export const UpdateAccountDocument = gql`
    mutation UpdateAccount($walletId: String!, $index: Int!, $name: String, $payLink: String) {
  updateAccount(
    walletId: $walletId
    index: $index
    name: $name
    payLink: $payLink
  ) {
    walletId
    index
    name
    payLink
  }
}
    `;
export type UpdateAccountMutationFn = Apollo.MutationFunction<UpdateAccountMutation, UpdateAccountMutationVariables>;

/**
 * __useUpdateAccountMutation__
 *
 * To run a mutation, you first call `useUpdateAccountMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateAccountMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateAccountMutation, { data, loading, error }] = useUpdateAccountMutation({
 *   variables: {
 *      walletId: // value for 'walletId'
 *      index: // value for 'index'
 *      name: // value for 'name'
 *      payLink: // value for 'payLink'
 *   },
 * });
 */
export function useUpdateAccountMutation(baseOptions?: Apollo.MutationHookOptions<UpdateAccountMutation, UpdateAccountMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateAccountMutation, UpdateAccountMutationVariables>(UpdateAccountDocument, options);
      }
export type UpdateAccountMutationHookResult = ReturnType<typeof useUpdateAccountMutation>;
export type UpdateAccountMutationResult = Apollo.MutationResult<UpdateAccountMutation>;
export type UpdateAccountMutationOptions = Apollo.BaseMutationOptions<UpdateAccountMutation, UpdateAccountMutationVariables>;
export const BroadcastBitcoinPaymentRequestDocument = gql`
    mutation BroadcastBitcoinPaymentRequest($id: String!) {
  broadcastBitcoinPaymentRequest(id: $id) {
    ...BitcoinPaymentRequestShared
  }
}
    ${BitcoinPaymentRequestSharedFragmentDoc}`;
export type BroadcastBitcoinPaymentRequestMutationFn = Apollo.MutationFunction<BroadcastBitcoinPaymentRequestMutation, BroadcastBitcoinPaymentRequestMutationVariables>;

/**
 * __useBroadcastBitcoinPaymentRequestMutation__
 *
 * To run a mutation, you first call `useBroadcastBitcoinPaymentRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useBroadcastBitcoinPaymentRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [broadcastBitcoinPaymentRequestMutation, { data, loading, error }] = useBroadcastBitcoinPaymentRequestMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useBroadcastBitcoinPaymentRequestMutation(baseOptions?: Apollo.MutationHookOptions<BroadcastBitcoinPaymentRequestMutation, BroadcastBitcoinPaymentRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<BroadcastBitcoinPaymentRequestMutation, BroadcastBitcoinPaymentRequestMutationVariables>(BroadcastBitcoinPaymentRequestDocument, options);
      }
export type BroadcastBitcoinPaymentRequestMutationHookResult = ReturnType<typeof useBroadcastBitcoinPaymentRequestMutation>;
export type BroadcastBitcoinPaymentRequestMutationResult = Apollo.MutationResult<BroadcastBitcoinPaymentRequestMutation>;
export type BroadcastBitcoinPaymentRequestMutationOptions = Apollo.BaseMutationOptions<BroadcastBitcoinPaymentRequestMutation, BroadcastBitcoinPaymentRequestMutationVariables>;
export const ConfirmPlatformKeySignRequestDocument = gql`
    mutation ConfirmPlatformKeySignRequest($id: String!, $verification: [String!]!) {
  confirmPlatformKeySignRequest(id: $id, verification: $verification) {
    id
    willSignAt
    signedAt
  }
}
    `;
export type ConfirmPlatformKeySignRequestMutationFn = Apollo.MutationFunction<ConfirmPlatformKeySignRequestMutation, ConfirmPlatformKeySignRequestMutationVariables>;

/**
 * __useConfirmPlatformKeySignRequestMutation__
 *
 * To run a mutation, you first call `useConfirmPlatformKeySignRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useConfirmPlatformKeySignRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [confirmPlatformKeySignRequestMutation, { data, loading, error }] = useConfirmPlatformKeySignRequestMutation({
 *   variables: {
 *      id: // value for 'id'
 *      verification: // value for 'verification'
 *   },
 * });
 */
export function useConfirmPlatformKeySignRequestMutation(baseOptions?: Apollo.MutationHookOptions<ConfirmPlatformKeySignRequestMutation, ConfirmPlatformKeySignRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<ConfirmPlatformKeySignRequestMutation, ConfirmPlatformKeySignRequestMutationVariables>(ConfirmPlatformKeySignRequestDocument, options);
      }
export type ConfirmPlatformKeySignRequestMutationHookResult = ReturnType<typeof useConfirmPlatformKeySignRequestMutation>;
export type ConfirmPlatformKeySignRequestMutationResult = Apollo.MutationResult<ConfirmPlatformKeySignRequestMutation>;
export type ConfirmPlatformKeySignRequestMutationOptions = Apollo.BaseMutationOptions<ConfirmPlatformKeySignRequestMutation, ConfirmPlatformKeySignRequestMutationVariables>;
export const CreateBitcoinPaymentRequestDocument = gql`
    mutation CreateBitcoinPaymentRequest($address: String!, $amount: BigInt!, $feeRate: Float!, $walletId: String!, $accountIndex: Int!, $memo: String, $maxOut: Boolean) {
  createBitcoinPaymentRequest(
    address: $address
    amount: $amount
    feeRate: $feeRate
    walletId: $walletId
    accountIndex: $accountIndex
    memo: $memo
    maxOut: $maxOut
  ) {
    ...BitcoinPaymentRequestShared
  }
}
    ${BitcoinPaymentRequestSharedFragmentDoc}`;
export type CreateBitcoinPaymentRequestMutationFn = Apollo.MutationFunction<CreateBitcoinPaymentRequestMutation, CreateBitcoinPaymentRequestMutationVariables>;

/**
 * __useCreateBitcoinPaymentRequestMutation__
 *
 * To run a mutation, you first call `useCreateBitcoinPaymentRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateBitcoinPaymentRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createBitcoinPaymentRequestMutation, { data, loading, error }] = useCreateBitcoinPaymentRequestMutation({
 *   variables: {
 *      address: // value for 'address'
 *      amount: // value for 'amount'
 *      feeRate: // value for 'feeRate'
 *      walletId: // value for 'walletId'
 *      accountIndex: // value for 'accountIndex'
 *      memo: // value for 'memo'
 *      maxOut: // value for 'maxOut'
 *   },
 * });
 */
export function useCreateBitcoinPaymentRequestMutation(baseOptions?: Apollo.MutationHookOptions<CreateBitcoinPaymentRequestMutation, CreateBitcoinPaymentRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateBitcoinPaymentRequestMutation, CreateBitcoinPaymentRequestMutationVariables>(CreateBitcoinPaymentRequestDocument, options);
      }
export type CreateBitcoinPaymentRequestMutationHookResult = ReturnType<typeof useCreateBitcoinPaymentRequestMutation>;
export type CreateBitcoinPaymentRequestMutationResult = Apollo.MutationResult<CreateBitcoinPaymentRequestMutation>;
export type CreateBitcoinPaymentRequestMutationOptions = Apollo.BaseMutationOptions<CreateBitcoinPaymentRequestMutation, CreateBitcoinPaymentRequestMutationVariables>;
export const CreatePlatformKeySignRequestDocument = gql`
    mutation CreatePlatformKeySignRequest($keyId: String!, $bitcoinPaymentRequestId: String) {
  createPlatformKeySignRequest(
    keyId: $keyId
    bitcoinPaymentRequestId: $bitcoinPaymentRequestId
  ) {
    ...PlatformKeySignRequestShared
  }
}
    ${PlatformKeySignRequestSharedFragmentDoc}`;
export type CreatePlatformKeySignRequestMutationFn = Apollo.MutationFunction<CreatePlatformKeySignRequestMutation, CreatePlatformKeySignRequestMutationVariables>;

/**
 * __useCreatePlatformKeySignRequestMutation__
 *
 * To run a mutation, you first call `useCreatePlatformKeySignRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreatePlatformKeySignRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createPlatformKeySignRequestMutation, { data, loading, error }] = useCreatePlatformKeySignRequestMutation({
 *   variables: {
 *      keyId: // value for 'keyId'
 *      bitcoinPaymentRequestId: // value for 'bitcoinPaymentRequestId'
 *   },
 * });
 */
export function useCreatePlatformKeySignRequestMutation(baseOptions?: Apollo.MutationHookOptions<CreatePlatformKeySignRequestMutation, CreatePlatformKeySignRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreatePlatformKeySignRequestMutation, CreatePlatformKeySignRequestMutationVariables>(CreatePlatformKeySignRequestDocument, options);
      }
export type CreatePlatformKeySignRequestMutationHookResult = ReturnType<typeof useCreatePlatformKeySignRequestMutation>;
export type CreatePlatformKeySignRequestMutationResult = Apollo.MutationResult<CreatePlatformKeySignRequestMutation>;
export type CreatePlatformKeySignRequestMutationOptions = Apollo.BaseMutationOptions<CreatePlatformKeySignRequestMutation, CreatePlatformKeySignRequestMutationVariables>;
export const DeletePlatformKeySignRequestDocument = gql`
    mutation DeletePlatformKeySignRequest($id: String!) {
  deletePlatformKeySignRequest(id: $id)
}
    `;
export type DeletePlatformKeySignRequestMutationFn = Apollo.MutationFunction<DeletePlatformKeySignRequestMutation, DeletePlatformKeySignRequestMutationVariables>;

/**
 * __useDeletePlatformKeySignRequestMutation__
 *
 * To run a mutation, you first call `useDeletePlatformKeySignRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeletePlatformKeySignRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deletePlatformKeySignRequestMutation, { data, loading, error }] = useDeletePlatformKeySignRequestMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeletePlatformKeySignRequestMutation(baseOptions?: Apollo.MutationHookOptions<DeletePlatformKeySignRequestMutation, DeletePlatformKeySignRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<DeletePlatformKeySignRequestMutation, DeletePlatformKeySignRequestMutationVariables>(DeletePlatformKeySignRequestDocument, options);
      }
export type DeletePlatformKeySignRequestMutationHookResult = ReturnType<typeof useDeletePlatformKeySignRequestMutation>;
export type DeletePlatformKeySignRequestMutationResult = Apollo.MutationResult<DeletePlatformKeySignRequestMutation>;
export type DeletePlatformKeySignRequestMutationOptions = Apollo.BaseMutationOptions<DeletePlatformKeySignRequestMutation, DeletePlatformKeySignRequestMutationVariables>;
export const GetBitcoinPaymentRequestDocument = gql`
    query GetBitcoinPaymentRequest($id: String!) {
  bitcoinPaymentRequest(id: $id) {
    ...BitcoinPaymentRequestShared
  }
}
    ${BitcoinPaymentRequestSharedFragmentDoc}`;

/**
 * __useGetBitcoinPaymentRequestQuery__
 *
 * To run a query within a React component, call `useGetBitcoinPaymentRequestQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetBitcoinPaymentRequestQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetBitcoinPaymentRequestQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetBitcoinPaymentRequestQuery(baseOptions: Apollo.QueryHookOptions<GetBitcoinPaymentRequestQuery, GetBitcoinPaymentRequestQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<GetBitcoinPaymentRequestQuery, GetBitcoinPaymentRequestQueryVariables>(GetBitcoinPaymentRequestDocument, options);
      }
export function useGetBitcoinPaymentRequestLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetBitcoinPaymentRequestQuery, GetBitcoinPaymentRequestQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<GetBitcoinPaymentRequestQuery, GetBitcoinPaymentRequestQueryVariables>(GetBitcoinPaymentRequestDocument, options);
        }
export type GetBitcoinPaymentRequestQueryHookResult = ReturnType<typeof useGetBitcoinPaymentRequestQuery>;
export type GetBitcoinPaymentRequestLazyQueryHookResult = ReturnType<typeof useGetBitcoinPaymentRequestLazyQuery>;
export type GetBitcoinPaymentRequestQueryResult = Apollo.QueryResult<GetBitcoinPaymentRequestQuery, GetBitcoinPaymentRequestQueryVariables>;
export const UpdateBitcoinPaymentRequestDocument = gql`
    mutation UpdateBitcoinPaymentRequest($id: String!, $psbt: String, $memo: String) {
  updateBitcoinPaymentRequest(id: $id, psbt: $psbt, memo: $memo) {
    ...BitcoinPaymentRequestShared
  }
}
    ${BitcoinPaymentRequestSharedFragmentDoc}`;
export type UpdateBitcoinPaymentRequestMutationFn = Apollo.MutationFunction<UpdateBitcoinPaymentRequestMutation, UpdateBitcoinPaymentRequestMutationVariables>;

/**
 * __useUpdateBitcoinPaymentRequestMutation__
 *
 * To run a mutation, you first call `useUpdateBitcoinPaymentRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateBitcoinPaymentRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateBitcoinPaymentRequestMutation, { data, loading, error }] = useUpdateBitcoinPaymentRequestMutation({
 *   variables: {
 *      id: // value for 'id'
 *      psbt: // value for 'psbt'
 *      memo: // value for 'memo'
 *   },
 * });
 */
export function useUpdateBitcoinPaymentRequestMutation(baseOptions?: Apollo.MutationHookOptions<UpdateBitcoinPaymentRequestMutation, UpdateBitcoinPaymentRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<UpdateBitcoinPaymentRequestMutation, UpdateBitcoinPaymentRequestMutationVariables>(UpdateBitcoinPaymentRequestDocument, options);
      }
export type UpdateBitcoinPaymentRequestMutationHookResult = ReturnType<typeof useUpdateBitcoinPaymentRequestMutation>;
export type UpdateBitcoinPaymentRequestMutationResult = Apollo.MutationResult<UpdateBitcoinPaymentRequestMutation>;
export type UpdateBitcoinPaymentRequestMutationOptions = Apollo.BaseMutationOptions<UpdateBitcoinPaymentRequestMutation, UpdateBitcoinPaymentRequestMutationVariables>;
export const CreateSignMessageRequestDocument = gql`
    mutation CreateSignMessageRequest {
  createSignMessageRequest {
    derivationPath
    id
  }
}
    `;
export type CreateSignMessageRequestMutationFn = Apollo.MutationFunction<CreateSignMessageRequestMutation, CreateSignMessageRequestMutationVariables>;

/**
 * __useCreateSignMessageRequestMutation__
 *
 * To run a mutation, you first call `useCreateSignMessageRequestMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateSignMessageRequestMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createSignMessageRequestMutation, { data, loading, error }] = useCreateSignMessageRequestMutation({
 *   variables: {
 *   },
 * });
 */
export function useCreateSignMessageRequestMutation(baseOptions?: Apollo.MutationHookOptions<CreateSignMessageRequestMutation, CreateSignMessageRequestMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateSignMessageRequestMutation, CreateSignMessageRequestMutationVariables>(CreateSignMessageRequestDocument, options);
      }
export type CreateSignMessageRequestMutationHookResult = ReturnType<typeof useCreateSignMessageRequestMutation>;
export type CreateSignMessageRequestMutationResult = Apollo.MutationResult<CreateSignMessageRequestMutation>;
export type CreateSignMessageRequestMutationOptions = Apollo.BaseMutationOptions<CreateSignMessageRequestMutation, CreateSignMessageRequestMutationVariables>;
export const SignMessageDocument = gql`
    mutation SignMessage($msg: String!, $signature: String!, $keyId: String) {
  signMessage(msg: $msg, signature: $signature, keyId: $keyId)
}
    `;
export type SignMessageMutationFn = Apollo.MutationFunction<SignMessageMutation, SignMessageMutationVariables>;

/**
 * __useSignMessageMutation__
 *
 * To run a mutation, you first call `useSignMessageMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSignMessageMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [signMessageMutation, { data, loading, error }] = useSignMessageMutation({
 *   variables: {
 *      msg: // value for 'msg'
 *      signature: // value for 'signature'
 *      keyId: // value for 'keyId'
 *   },
 * });
 */
export function useSignMessageMutation(baseOptions?: Apollo.MutationHookOptions<SignMessageMutation, SignMessageMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<SignMessageMutation, SignMessageMutationVariables>(SignMessageDocument, options);
      }
export type SignMessageMutationHookResult = ReturnType<typeof useSignMessageMutation>;
export type SignMessageMutationResult = Apollo.MutationResult<SignMessageMutation>;
export type SignMessageMutationOptions = Apollo.BaseMutationOptions<SignMessageMutation, SignMessageMutationVariables>;
export type GetBitcoinKeyQueryVariables = Exact<{
  keyId: Scalars['String'];
}>;


export type GetBitcoinKeyQuery = { __typename?: 'Query', bitcoinKey: { __typename?: 'BitcoinKey', id: string, derivationPath: string, masterFingerprint: string, publicKey: string, walletType: string } };

export type GetKeyQueryVariables = Exact<{
  keyId: Scalars['String'];
}>;


export type GetKeyQuery = { __typename?: 'Query', key: { __typename?: 'Key', id: string, walletId: string, lastVerifiedAt: Date, name?: string | null, ownershipType: KeyOwnershipType, blockchainType: BlockchainType, signatures?: Array<{ __typename?: 'SignMessageRequest', expiresAt: Date, id: string, signedWith?: string | null }> | null } };

export type GetPlatformKeyBillingQueryVariables = Exact<{
  keyId: Scalars['String'];
}>;


export type GetPlatformKeyBillingQuery = { __typename?: 'Query', platformKeyBilling: { __typename?: 'PlatformKeyBillingSummary', keyId: string, billingAddress: string, paidUntil: Date, billing: Array<{ __typename?: 'PlatformKeyBilling', amountPaid: number, basePrice: number, createdAt: Date, discountPrice: number, id: string, monthsPaid: number }> } };

export type UpdatePlatformKeyMutationVariables = Exact<{
  input: UpdatePlatformKeyInput;
}>;


export type UpdatePlatformKeyMutation = { __typename?: 'Mutation', updatePlatformKey: { __typename?: 'PartialPlatformKey', id: string, quizQuestions: Array<string>, verificationPediod: number, verificationType: PlatformKeyVerificationType } };

export type GetSessionQueryVariables = Exact<{ [key: string]: never; }>;


export type GetSessionQuery = { __typename?: 'Query', session?: { __typename?: 'PartialSession', expiresAt?: Date | null, id: string, walletId: string, signMessageRequests: Array<{ __typename?: 'SignMessageRequest', expiresAt: Date, id: string, signedWith?: string | null }> } | null };

export type GetRecoveryInfoQueryVariables = Exact<{
  accountIndex: Scalars['Int'];
  walletId: Scalars['String'];
}>;


export type GetRecoveryInfoQuery = { __typename?: 'Query', recoveryInfo: Array<{ __typename?: 'RecoveryInfoItem', type: string, publicKey: string, derivationPath: string, masterFingerprint: string, walletType: string }> };

export type CreateAccountMutationVariables = Exact<{
  walletId: Scalars['String'];
  name?: InputMaybe<Scalars['String']>;
}>;


export type CreateAccountMutation = { __typename?: 'Mutation', createAccount: { __typename?: 'Account', walletId: string, index: number, name: string, receiveBitcoinAddress?: string | null } };

export type StreamBitcoinChainInfoSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type StreamBitcoinChainInfoSubscription = { __typename?: 'Subscription', bitcoinChainInfo: { __typename?: 'BitcoinChainInfo', updatedAt: Date, feeRates: Array<number>, id: string, usdPrice?: number | null } };

export type GetBitcoinChainInfoQueryVariables = Exact<{ [key: string]: never; }>;


export type GetBitcoinChainInfoQuery = { __typename?: 'Query', bitcoinChainInfo: { __typename?: 'BitcoinChainInfo', updatedAt: Date, feeRates: Array<number>, id: string, usdPrice?: number | null, lastBlock: number } };

export type GetTransactionQueryVariables = Exact<{
  txHash: Scalars['String'];
}>;


export type GetTransactionQuery = { __typename?: 'Query', transaction?: { __typename?: 'BitcoinTransaction', height?: number | null, txHash: string, blockTimestamp?: Date | null, inputs: Array<{ __typename?: 'BitcoinOutput', txPos: number, value: number, spentInTransaction: { __typename?: 'BitcoinTransaction', blockTimestamp?: Date | null, outputs: Array<{ __typename?: 'BitcoinOutput', value: number, bitcoinAddress: { __typename?: 'BitcoinAddress', address: string, account: { __typename?: 'Account', walletId: string, index: number } } }> } }>, outputs: Array<{ __typename?: 'BitcoinOutput', value: number, bitcoinAddress: { __typename?: 'BitcoinAddress', address: string, account: { __typename?: 'Account', walletId: string, index: number } } }> } | null };

export type GetWalletQueryVariables = Exact<{
  id: Scalars['String'];
}>;


export type GetWalletQuery = { __typename?: 'Query', wallet: { __typename?: 'Wallet', id: string, name: string, type: BlockchainType, threshold: number, accounts: Array<{ __typename?: 'Account', walletId: string, index: number, name: string, payLink?: string | null, receiveBitcoinAddress?: string | null, bitcoinPaymentRequests: Array<{ __typename?: 'BitcoinPaymentRequest', id: string, amount: number, address: string, memo?: string | null }> }>, keys: Array<{ __typename?: 'Key', id: string, ownershipType: KeyOwnershipType, lastVerifiedAt: Date, name?: string | null, signatures?: Array<{ __typename?: 'SignMessageRequest', id: string, expiresAt: Date }> | null }> } };

export type GetWalletBalanceSubscriptionVariables = Exact<{
  walletId: Scalars['String'];
  accountIndex: Scalars['Int'];
}>;


export type GetWalletBalanceSubscription = { __typename?: 'Subscription', bitcoinWalletBalance: { __typename?: 'BitcoinWalletBalance', confirmed: number, unconfirmed: number } };

export type GetWalletBalanceQueryQueryVariables = Exact<{
  walletId: Scalars['String'];
  accountIndex: Scalars['Int'];
}>;


export type GetWalletBalanceQueryQuery = { __typename?: 'Query', bitcoinWalletBalance: { __typename?: 'BitcoinWalletBalance', confirmed: number, unconfirmed: number } };

export type GetWalletTransactionsQueryVariables = Exact<{
  walletId: Scalars['String'];
  accountIndex: Scalars['Int'];
}>;


export type GetWalletTransactionsQuery = { __typename?: 'Query', walletTransactions: Array<{ __typename?: 'BitcoinTransaction', height?: number | null, txHash: string, blockTimestamp?: Date | null, label?: string | null, inputs: Array<{ __typename?: 'BitcoinOutput', txPos: number, value: number, bitcoinAddress: { __typename?: 'BitcoinAddress', address: string, account: { __typename?: 'Account', walletId: string, index: number } } }>, outputs: Array<{ __typename?: 'BitcoinOutput', value: number, bitcoinAddress: { __typename?: 'BitcoinAddress', address: string, account: { __typename?: 'Account', walletId: string, index: number } } }> }> };

export type RemoveBitcoinPaymentRequestMutationVariables = Exact<{
  id: Scalars['String'];
}>;


export type RemoveBitcoinPaymentRequestMutation = { __typename?: 'Mutation', removeBitcoinPaymentRequest: boolean };

export type SetTransactionLabelMutationVariables = Exact<{
  txHash: Scalars['String'];
  label: Scalars['String'];
}>;


export type SetTransactionLabelMutation = { __typename?: 'Mutation', setTransactionLabel: { __typename?: 'BitcoinTransaction', txHash: string, label?: string | null } };

export type UpdateAccountMutationVariables = Exact<{
  walletId: Scalars['String'];
  index: Scalars['Int'];
  name?: InputMaybe<Scalars['String']>;
  payLink?: InputMaybe<Scalars['String']>;
}>;


export type UpdateAccountMutation = { __typename?: 'Mutation', updateAccount: { __typename?: 'Account', walletId: string, index: number, name: string, payLink?: string | null } };

export type BitcoinPaymentRequestSharedFragment = { __typename?: 'BitcoinPaymentRequest', id: string, address: string, amount: number, fee: number, memo?: string | null, psbt?: string | null, signedWithKeys: Array<{ __typename?: 'Key', id: string, name?: string | null, ownershipType: KeyOwnershipType }>, signRequest?: { __typename?: 'PlatformKeySignRequest', id: string, willSignAt?: Date | null, signedAt?: Date | null, expiresAt: Date, isExpired: boolean, platformKey: { __typename?: 'PartialPlatformKey', verificationType: PlatformKeyVerificationType, quizQuestions: Array<string> } } | null, transaction?: { __typename?: 'BitcoinTransaction', txHash: string, source: BitcoinTransactionSource, error?: string | null } | null };

export type BroadcastBitcoinPaymentRequestMutationVariables = Exact<{
  id: Scalars['String'];
}>;


export type BroadcastBitcoinPaymentRequestMutation = { __typename?: 'Mutation', broadcastBitcoinPaymentRequest: { __typename?: 'BitcoinPaymentRequest', id: string, address: string, amount: number, fee: number, memo?: string | null, psbt?: string | null, signedWithKeys: Array<{ __typename?: 'Key', id: string, name?: string | null, ownershipType: KeyOwnershipType }>, signRequest?: { __typename?: 'PlatformKeySignRequest', id: string, willSignAt?: Date | null, signedAt?: Date | null, expiresAt: Date, isExpired: boolean, platformKey: { __typename?: 'PartialPlatformKey', verificationType: PlatformKeyVerificationType, quizQuestions: Array<string> } } | null, transaction?: { __typename?: 'BitcoinTransaction', txHash: string, source: BitcoinTransactionSource, error?: string | null } | null } };

export type ConfirmPlatformKeySignRequestMutationVariables = Exact<{
  id: Scalars['String'];
  verification: Array<Scalars['String']>;
}>;


export type ConfirmPlatformKeySignRequestMutation = { __typename?: 'Mutation', confirmPlatformKeySignRequest: { __typename?: 'PlatformKeySignRequest', id: string, willSignAt?: Date | null, signedAt?: Date | null } };

export type CreateBitcoinPaymentRequestMutationVariables = Exact<{
  address: Scalars['String'];
  amount: Scalars['BigInt'];
  feeRate: Scalars['Float'];
  walletId: Scalars['String'];
  accountIndex: Scalars['Int'];
  memo?: InputMaybe<Scalars['String']>;
  maxOut?: InputMaybe<Scalars['Boolean']>;
}>;


export type CreateBitcoinPaymentRequestMutation = { __typename?: 'Mutation', createBitcoinPaymentRequest: { __typename?: 'BitcoinPaymentRequest', id: string, address: string, amount: number, fee: number, memo?: string | null, psbt?: string | null, signedWithKeys: Array<{ __typename?: 'Key', id: string, name?: string | null, ownershipType: KeyOwnershipType }>, signRequest?: { __typename?: 'PlatformKeySignRequest', id: string, willSignAt?: Date | null, signedAt?: Date | null, expiresAt: Date, isExpired: boolean, platformKey: { __typename?: 'PartialPlatformKey', verificationType: PlatformKeyVerificationType, quizQuestions: Array<string> } } | null, transaction?: { __typename?: 'BitcoinTransaction', txHash: string, source: BitcoinTransactionSource, error?: string | null } | null } };

export type CreatePlatformKeySignRequestMutationVariables = Exact<{
  keyId: Scalars['String'];
  bitcoinPaymentRequestId?: InputMaybe<Scalars['String']>;
}>;


export type CreatePlatformKeySignRequestMutation = { __typename?: 'Mutation', createPlatformKeySignRequest: { __typename?: 'PlatformKeySignRequest', id: string, willSignAt?: Date | null, signedAt?: Date | null, expiresAt: Date, isExpired: boolean, platformKey: { __typename?: 'PartialPlatformKey', verificationType: PlatformKeyVerificationType, quizQuestions: Array<string> } } };

export type DeletePlatformKeySignRequestMutationVariables = Exact<{
  id: Scalars['String'];
}>;


export type DeletePlatformKeySignRequestMutation = { __typename?: 'Mutation', deletePlatformKeySignRequest: boolean };

export type GetBitcoinPaymentRequestQueryVariables = Exact<{
  id: Scalars['String'];
}>;


export type GetBitcoinPaymentRequestQuery = { __typename?: 'Query', bitcoinPaymentRequest: { __typename?: 'BitcoinPaymentRequest', id: string, address: string, amount: number, fee: number, memo?: string | null, psbt?: string | null, signedWithKeys: Array<{ __typename?: 'Key', id: string, name?: string | null, ownershipType: KeyOwnershipType }>, signRequest?: { __typename?: 'PlatformKeySignRequest', id: string, willSignAt?: Date | null, signedAt?: Date | null, expiresAt: Date, isExpired: boolean, platformKey: { __typename?: 'PartialPlatformKey', verificationType: PlatformKeyVerificationType, quizQuestions: Array<string> } } | null, transaction?: { __typename?: 'BitcoinTransaction', txHash: string, source: BitcoinTransactionSource, error?: string | null } | null } };

export type PlatformKeySignRequestSharedFragment = { __typename?: 'PlatformKeySignRequest', id: string, willSignAt?: Date | null, signedAt?: Date | null, expiresAt: Date, isExpired: boolean, platformKey: { __typename?: 'PartialPlatformKey', verificationType: PlatformKeyVerificationType, quizQuestions: Array<string> } };

export type UpdateBitcoinPaymentRequestMutationVariables = Exact<{
  id: Scalars['String'];
  psbt?: InputMaybe<Scalars['String']>;
  memo?: InputMaybe<Scalars['String']>;
}>;


export type UpdateBitcoinPaymentRequestMutation = { __typename?: 'Mutation', updateBitcoinPaymentRequest: { __typename?: 'BitcoinPaymentRequest', id: string, address: string, amount: number, fee: number, memo?: string | null, psbt?: string | null, signedWithKeys: Array<{ __typename?: 'Key', id: string, name?: string | null, ownershipType: KeyOwnershipType }>, signRequest?: { __typename?: 'PlatformKeySignRequest', id: string, willSignAt?: Date | null, signedAt?: Date | null, expiresAt: Date, isExpired: boolean, platformKey: { __typename?: 'PartialPlatformKey', verificationType: PlatformKeyVerificationType, quizQuestions: Array<string> } } | null, transaction?: { __typename?: 'BitcoinTransaction', txHash: string, source: BitcoinTransactionSource, error?: string | null } | null } };

export type CreateSignMessageRequestMutationVariables = Exact<{ [key: string]: never; }>;


export type CreateSignMessageRequestMutation = { __typename?: 'Mutation', createSignMessageRequest: { __typename?: 'PartialSignMessageRequest', derivationPath: string, id: string } };

export type SignMessageMutationVariables = Exact<{
  msg: Scalars['String'];
  signature: Scalars['String'];
  keyId?: InputMaybe<Scalars['String']>;
}>;


export type SignMessageMutation = { __typename?: 'Mutation', signMessage: boolean };
