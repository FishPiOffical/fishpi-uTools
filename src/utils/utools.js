class UToolsWrapper {
  constructor() {
    this.isUToolsEnv = typeof window !== "undefined" && !!window.utools;
  }

  dbStorage = {
    getItem: (key) => {
      try {
        if (this.isUToolsEnv) {
          const result = window.utools.db.get(key);
          return result ? result.value : null;
        }
        return localStorage.getItem(key);
      } catch (error) {
        console.error("getItem error:", error);
        return null;
      }
    },

    setItem: (key, value) => {
      try {
        if (this.isUToolsEnv) {
          window.utools.db.put({ _id: key, value });
          return true;
        }
        localStorage.setItem(key, value);
        return true;
      } catch (error) {
        console.error("setItem error:", error);
        return false;
      }
    },

    removeItem: (key) => {
      try {
        if (this.isUToolsEnv) {
          window.utools.db.remove(key);
          return true;
        }
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error("removeItem error:", error);
        return false;
      }
    },

    clear: () => {
      try {
        if (this.isUToolsEnv) {
          const allDocs = window.utools.db.allDocs();
          allDocs.rows.forEach((row) => {
            window.utools.db.remove(row.id);
          });
          return true;
        }
        localStorage.clear();
        return true;
      } catch (error) {
        console.error("clear error:", error);
        return false;
      }
    },
  };

  showNotification = (message) => {
    if (this.isUToolsEnv && window.utools.showNotification) {
      window.utools.showNotification(message);
    } else {
      console.log("[Notification]:", message);
      if (Notification.permission === "granted") {
        new Notification(message);
      }
    }
  };

  onPluginEnter = (callback) => {
    if (this.isUToolsEnv) {
      window.utools.onPluginEnter(callback);
    } else {
      console.log("onPluginEnter registered (mock)");
    }
  };

  onPluginOut = (callback) => {
    if (this.isUToolsEnv) {
      window.utools.onPluginOut(callback);
    } else {
      console.log("onPluginOut registered (mock)");
    }
  };
}


const utools = new UToolsWrapper();

export default utools;
