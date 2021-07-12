import React, {createContext, useContext, useState} from "react";
import {Route, Redirect} from "react-router-dom";
import {
  addAuthListener,
  getAuthCookie,
  setAuthCookie
} from "./Managers/CookieManager";
import {validateGoogleUser} from "./Managers/EndpointManager";

// Source: https://reactrouter.com/web/example/auth-workflow

/** For more details on
 * `authContext`, `ProvideAuth`, `useAuth` and `useProvideAuth`
 * refer to: https://usehooks.com/useAuth/
 */
const authContext = createContext(undefined);

export function ProvideGoogleAuth({children}) {
  const auth = useGoogleAuthProvider();
  return (
    <authContext.Provider value={auth}>
      {children}
    </authContext.Provider>
  );
}

export function useAuth() {
  return useContext(authContext);
}

// Authentication state holding the auth provider
function useGoogleAuthProvider() {
  const [user, setUser] = useState(getAuthCookie());  // when users refresh, immediately loads auth cookie
  addAuthListener(listenerCallback);

  function signin(credentials) {
    console.log("Signing in with Gauth");
    const id_token = credentials.getAuthResponse().id_token;
    return validateGoogleUser(id_token)
      .then(() => {
        console.log("Stored info in backend");
        const profile = credentials.getBasicProfile();
        const id = profile.getId(); // Do not send to your backend! Use an ID token instead.
        const name = profile.getName();
        const image = profile.getImageUrl();
        const email = profile.getEmail(); // This is null if the 'email' scope is not present.
        setAuthCookie({id, name, image, email});  // theoretically, this should setUser as well, since we added a listener to it
        return Promise.resolve();
      })
      .catch(err => {
        console.error(err);
        alert("Unable to signin. Check your credentials.");
      });
  }

  function signout() {
    console.log("Signing out with Gauth");
    setAuthCookie("");
  }

  function listenerCallback(new_cookie) {
    console.log(`New Cookie Value: ${new_cookie.value}`);
    setUser(new_cookie.value);
  }

  return {
    user,
    signin,
    signout,
  };
}

// A wrapper for <Route> that redirects to the login
// screen if you're not yet authenticated.
export function PrivateRoute({children, ...rest}) {
  const auth = useAuth();
  return (
    <Route
      {...rest}
      render={({location}) =>
        auth.user ? (
          children
        ) : (
          <Redirect // TODO: May want to redirect to actual login page, but not necessary since they can't hit this route through the UI
            to={{
              pathname: "/",
              state: {from: location}
            }}
          />
        )
      }
    />
  );
}

/*
function LoginPage() {
  let history = useHistory();
  let location = useLocation();
  let auth = useAuth();

  let { from } = location.state || { from: { pathname: "/" } };
  let login = () => {
    auth.signin(() => {
      history.replace(from);
    });
  };

  return (
    <div>
      <p>You must log in to view the page at {from.pathname}</p>
      <button onClick={login}>Log in</button>
    </div>
  );
}
*/
