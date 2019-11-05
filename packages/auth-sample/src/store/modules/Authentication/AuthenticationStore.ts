import { ActionTree, MutationTree } from 'vuex'

import { HttpService, RestService } from '@vuescape/http'
import { AuthenticationOperation } from '@vuescape/store/modules/Authentication'
import { RootOperation } from '@vuescape/store/modules/Root'
import {
  ModuleState,
  StoreModule,
  StoreModuleOptions,
  StoreOperation,
} from '@vuescape/store/modules/types'
import { RootState } from '@vuescape/store/RootState'

import { AuthenticationInfo, AuthenticationStoreErrorHandlerBuilder, Credentials, SIGNIN_TOKEN_KEY } from '.'

export class AuthenticationStore extends StoreModule<AuthenticationInfo, ModuleState<AuthenticationInfo>, RootState> {
  constructor() {
    super({
      isNamespaced: true,
    })
    this.addActions(this.myActions())
    this.addMutations(this.myMutations())
  }

  private myMutations: () => MutationTree<ModuleState<AuthenticationInfo>> = () => {
    return {
      [AuthenticationOperation.Mutation.SIGN_IN](currentState, signInToken: AuthenticationInfo) {
        if (typeof window !== 'undefined') {
          // TODO: abstract window.localstorage
          window.localStorage.setItem(SIGNIN_TOKEN_KEY, JSON.stringify(signInToken))
        }
        currentState.value = signInToken
        HttpService.useAuthToken(signInToken.access_token)
      },
      [AuthenticationOperation.Mutation.SIGN_OUT](currentState: ModuleState<AuthenticationInfo>) {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(SIGNIN_TOKEN_KEY)
        }
        currentState.value = {}
      },
    }
  }
  private myActions: () => ActionTree<ModuleState<AuthenticationInfo>, RootState> = () => {
    const authStore = this as AuthenticationStore
    return {
      async [AuthenticationOperation.Action.TRY_RESIGN_IN](context) {
        const signInTokenJson = window.localStorage.getItem(SIGNIN_TOKEN_KEY)
        if (signInTokenJson && signInTokenJson !== 'undefined') {
          const signInToken = JSON.parse(signInTokenJson) as AuthenticationInfo
          await context.dispatch(AuthenticationOperation.Action.SIGN_IN_WITH_TOKEN, signInToken)
        }
      },
      async [AuthenticationOperation.Action.SIGN_IN_WITH_TOKEN](context, authInfo: AuthenticationInfo) {
        context.commit(AuthenticationOperation.Mutation.SIGN_IN, authInfo)
        // After signed in call profile to retrieve user info
        // await context.dispatch(`${UserProfileModuleName}/${UserProfileOperation.Action.UserProfile}`, undefined, {
        //   root: true,
        // })
      },
      async [AuthenticationOperation.Action.SIGN_IN_WITH_CREDENTIALS](context, credentials: Credentials) {
        const signInRequest = {
          email: credentials.username,
          password: credentials.password,
          // client_id: '',
          // grant_type: 'password',
        }

        const signInPostAction = new RestService<{}>('https://reqres.in/api/login').post()

        await context.dispatch(StoreOperation.Action.NotificationActions.CLEAR)

        await authStore.executeAsyncAction(
          signInPostAction,
          signInRequest,
          context,
          new StoreModuleOptions<AuthenticationInfo>({
            errorHandlerBuilder: new AuthenticationStoreErrorHandlerBuilder(),
          }),
        )

        const authStoreState = authStore.state as ModuleState<AuthenticationInfo>
        if (authStoreState.asyncResult.status === 200) {
          await context.dispatch(AuthenticationOperation.Action.SIGN_IN_WITH_TOKEN, context.state.value)
          context.commit(RootOperation.Mutation.IS_AUTHENTICATED, true, { root: true })
        }
      },
      async [AuthenticationOperation.Action.SIGN_OUT](context) {
        context.commit(AuthenticationOperation.Mutation.SIGN_OUT)
        context.commit(RootOperation.Mutation.IS_AUTHENTICATED, false, { root: true })
      },
    }
  }
}
