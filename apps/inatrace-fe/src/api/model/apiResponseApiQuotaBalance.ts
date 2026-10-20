import { ApiQuotaBalance } from './apiQuotaBalance';
import { ApiValidationErrorDetails } from './apiValidationErrorDetails';

export interface ApiResponseApiQuotaBalance {
    status: ApiResponseApiQuotaBalance.StatusEnum;
    errorMessage?: string;
    data?: ApiQuotaBalance;
    errorDetails?: string;
    validationErrorDetails?: ApiValidationErrorDetails;
}

export namespace ApiResponseApiQuotaBalance {
    export type StatusEnum = 'OK' | 'ERROR' | 'REQUEST_BODY_ERROR' | 'VALIDATION_ERROR' | 'TOO_MANY_REQUESTS' | 'UNAUTHORIZED' | 'AUTH_ERROR' | 'UPSTREAM_HTTP_ERROR' | 'INVALID_REQUEST' | 'INVALID_OR_EXPIRED_STORAGE_KEY' | 'NOT_IMPLEMENTED' | 'NOT_FOUND';
    export const StatusEnum = {
        OK: 'OK' as StatusEnum,
        ERROR: 'ERROR' as StatusEnum,
        REQUESTBODYERROR: 'REQUEST_BODY_ERROR' as StatusEnum,
        VALIDATIONERROR: 'VALIDATION_ERROR' as StatusEnum,
        TOOMANYREQUESTS: 'TOO_MANY_REQUESTS' as StatusEnum,
        UNAUTHORIZED: 'UNAUTHORIZED' as StatusEnum,
        AUTHERROR: 'AUTH_ERROR' as StatusEnum,
        UPSTREAMHTTPERROR: 'UPSTREAM_HTTP_ERROR' as StatusEnum,
        INVALIDREQUEST: 'INVALID_REQUEST' as StatusEnum,
        INVALIDOREXPIREDSTORAGEKEY: 'INVALID_OR_EXPIRED_STORAGE_KEY' as StatusEnum,
        NOTIMPLEMENTED: 'NOT_IMPLEMENTED' as StatusEnum,
        NOTFOUND: 'NOT_FOUND' as StatusEnum
    };
}
