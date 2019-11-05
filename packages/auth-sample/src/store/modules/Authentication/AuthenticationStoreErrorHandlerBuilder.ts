import { ActionContext } from 'vuex'

import {
  ErrorHandler,
  ErrorHandlerBuilder,
  NotificationMessage,
  NotificationType,
  StoreOperation,
} from '@vuescape/store/modules/types'
import { Guid } from '@vuescape/types'

export class AuthenticationStoreErrorHandlerBuilder<S, R> implements ErrorHandlerBuilder {
  private context: ActionContext<S, R>
  private shouldUseGlobalNotifications = false

  public build(config: any): ErrorHandler {
    if (!config.context) {
      throw new Error('Expected config object to have a context property of type ActionContext')
    }

    if (config.shouldUseGlobalNotifications) {
      this.shouldUseGlobalNotifications = config.shouldUseGlobalNotifications
    }

    this.context = config.context
    return this.handleError
  }

  private handleError = async (error: any) => {
    if (error && error.response && error.response.status) {
      const statusCode = error.response.status
      const notification: NotificationMessage = {
        key: Guid.newGuid(),
        message: '',
        type: NotificationType.Error,
      }

      if (statusCode === 400) {
        const errorDetails = error.response.data
        // Get error details from response. This depends on response format 
        const errorDescription = errorDetails.error
        notification.message = errorDescription
      } else {
        notification.message = error.message
      }
      await this.context.dispatch(StoreOperation.Action.NotificationActions.CLEAR)
      await this.context.dispatch(StoreOperation.Action.NotificationActions.ADD, notification)
      return
    }
    console.error(error)
    const errorMessage: NotificationMessage = {
      key: Guid.newGuid(),
      type: NotificationType.Error,
      message: error.message,
    }
    this.context.commit(StoreOperation.Action.NotificationActions.ADD, errorMessage, {
      root: this.shouldUseGlobalNotifications,
    })
    // This is usually some sort of network issue
    this.context.commit(StoreOperation.Mutation.SET_ASYNC_RESULT, {
      status: 523,
      statusText: error.message,
    })
  }
}
