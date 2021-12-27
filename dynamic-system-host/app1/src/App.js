import React from "react";

function loadComponent(scope, module) {
  return async () => {
    // Initializes the share scope. This fills it with known provided modules from this build and all remotes
    await __webpack_init_sharing__("default");
    const container = window[scope]; // or get the container somewhere else
    // Initialize the container, it may provide shared modules
    await container.init(__webpack_share_scopes__.default);
    const factory = await window[scope].get(module);
    const Module = factory();
    return Module;
  };
}

const useDynamicScript = (args) => {
  const [ready, setReady] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    if (!args.url) {
      return;
    }

    const element = document.createElement("script");

    element.src = args.url;
    element.type = "text/javascript";
    element.async = true;

    setReady(false);
    setFailed(false);

    element.onload = () => {
      console.log(`Dynamic Script Loaded: ${args.url}`);
      setReady(true);
    };

    element.onerror = () => {
      console.error(`Dynamic Script Error: ${args.url}`);
      setReady(false);
      setFailed(true);
    };

    document.head.appendChild(element);

    return () => {
      console.log(`Dynamic Script Removed: ${args.url}`);
      document.head.removeChild(element);
    };
  }, [args.url]);

  return {
    ready,
    failed,
  };
};

function System(props) {

  /** 
   *  // NOTE - 2.0 把 url 传入 useDynamicScript() 后, 可获取到分别两个不同的状态
   *    - ready
   *    - failed
   *  同时, 除了会提供两个状态的返回值外, 其实最最最主要目的还是把组件挂载到网页中来了, 即挂载了一下链接: 
   *  http://localhost:3002/remoteEntry.js
   */
  const { ready, failed } = useDynamicScript({
    url: props.system && props.system.url,
  });

  // NOTE - 2.1 根据 2.1 拿到状态后, 下面是三个对应不同状态处理异常后的, 对应的, 页面显示结果
  if (!props.system) {
    return <h2>Not system specified</h2>;
  }

  if (!ready) {
    return <h2>Loading dynamic script: {props.system.url}</h2>;
  }

  if (failed) {
    return <h2>Failed to load dynamic script: {props.system.url}</h2>;
  }

  // NOTE - 2.2 上面处理完状态后, 因为组件已经挂载到 window 对象中, 所以可以通过 loadComponent  获取到全局作用域下的组件
  /**
   *  传参如下:
   *    - scope: "app2",
   *    - module: "./Widget",
   */
  const Component = React.lazy(
    loadComponent(props.system.scope, props.system.module)
  );

  return (
    <React.Suspense fallback="Loading System">
      {/* NOTE - 2.3 显然, 这里就是就是动态加载过来的新组件 */}
      <Component />
    </React.Suspense>
  );
}

function App() {
  const [system, setSystem] = React.useState(undefined);

  function setApp2() {
    setSystem({
      url: "http://localhost:3002/remoteEntry.js",
      scope: "app2",
      module: "./Widget",
    });
  }

  function setApp3() {
    setSystem({
      url: "http://localhost:3003/remoteEntry.js",
      scope: "app3",
      module: "./Widget",
    });
  }

  return (
    <div
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
      }}
    >
      <h1>Dynamic System Host</h1>
      <h2>App 1</h2>
      <p>
        The Dynamic System will take advantage Module Federation{" "}
        <strong>remotes</strong> and <strong>exposes</strong>. It will no load
        components that have been loaded already.
      </p>
      <button onClick={setApp2}>Load App 2 Widget</button>
      <button onClick={setApp3}>Load App 3 Widget</button>
      <div style={{ marginTop: "2em" }}>

        {/* NOTE - 1.0 通过 <System /> 组件接收不同 "system参数", 从而对应渲染不同的动态组件 */}

        {/* <System /> 组件接受一个 system 参数, 该参数数据格式如下: 

          {
            url: "http://localhost:3002/remoteEntry.js",
            scope: "app2",
            module: "./Widget",
          }

        */}
        <System system={system} />
      </div>
    </div>
  );
}

export default App;
