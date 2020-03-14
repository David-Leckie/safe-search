
export default {
  

authoriseAndConnect: async function() {
  /*connecting message*/
  let authorisingMessage = document.getElementById("authorisingMessage");
  authorisingMessage.className = authorisingMessage.className.replace("", "show");

  window.appInfo = {
    name: 'Safe Index',
    id: 'safe-index',
    version: '1.0.0',
    vendor: 'David-Leckie'
  };
  window.safeApp = await window.safe.initialiseApp(appInfo);
  console.log('Authorising SAFE application...');

  const containerPermissions = {
    _public: [
      'Read',
      'Insert',
      'Update',
      'Delete'
    ]
  };

  const authorisationOptions = {own_container: true};
  
  const authReqUri = await safeApp.auth.genAuthUri(
    containerPermissions,
    authorisationOptions
  );
      let authUri = await window.safe.authorise(authReqUri);
      console.log('SAFE application authorised by user');
      await safeApp.auth.loginFromUri(authUri);
      console.log("Application connected to the network");

      authorisingMessage.className = authorisingMessage.className.replace("show", "");
  
},

checkForMutableData: async function() {
  try {
    let ownContainerName = await window.safeApp.getOwnContainerName();
    window.ownContainer = await window.safeApp.auth.getContainer(ownContainerName);
    let keyName = 'alpha2SitesListMD';
    let selectedMD = await ownContainer.get(keyName);
    return selectedMD;
  }
  catch (err) { 
    return false
  }
},

getMutableDataAddress: async function() {

  if (await this.checkForMutableData() == false) {
    console.log("Creating MutableData with initial dataset...");
    const name = [63, 167, 192, 128, 107, 134, 157, 174, 36, 227, 25, 15, 67, 137, 251, 100, 114, 63, 204, 101, 228, 76, 56, 158, 70, 198, 255, 21, 182, 156, 175, 21];
    const typeTag = 15000;
    //window.md = await window.safeApp.mutableData.newRandomPublic(typeTag);
    window.md = await window.safeApp.mutableData.newPublic(name, typeTag)
    const initialData = {
      "safe://template": JSON.stringify({
          name: 'Template',
          url: 'safe://template',
          description: 'Safe Template Site Description',
          keywords: 'test words',
          category1: 'Tools',
          category1SubCategoryA: 'Storage',
          category1SubCategoryB: 'Computing',
          category2: 'Information',
          category2SubCategoryA: 'SAFE',
          category2SubCategoryB: 'Tech',
          dateAdded: Date(),
          dateUpdated: Date(),
          delete: false,
          verified: 'Yes',
          requestRemove: 'No',
      })
    };
    await window.md.quickSetup(initialData);
    let nameAndTag = await window.md.getNameAndTag();
    const entryKey = 'alpha2SitesListMD'
    const mutations = await window.safeApp.mutableData.newMutation();
    await mutations.insert(entryKey, JSON.stringify(nameAndTag));
    await window.ownContainer.applyEntriesMutation(mutations);
    window.storedNameAndTag = await window.ownContainer.get(entryKey);
    return window.storedNameAndTag;
  }
  else {
    let keyName = 'alpha2SitesListMD';
    let selectedMD = await window.ownContainer.get(keyName);
    const value = selectedMD;
    window.storedNameAndTag = JSON.parse(value.buf); 
    return window.storedNameAndTag;
  }

},

showMutableData: async function() {
  let displayedNameAndTag = await this.getMutableDataAddress();
  return displayedNameAndTag
},

setMDPermissions: async function() {
  try {
    const version = await window.md.getVersion();
    const pmSet = 
    ['Read',
    'Insert',
    'Update'];
    const permissionSet = await window.md.setUserPermissions(
    safe.CONSTANTS.USER_ANYONE, pmSet, version + 1
    );
  }
  catch (err) {
    return
  }
},

linkToMutableData: async function() {
  /*connecting message*/
  let connectingMessage = document.getElementById("connectingMessage");
  connectingMessage.className = connectingMessage.className.replace("", "show");

  let storedNameAndTag = await this.getMutableDataAddress();
  window.linkedMD = await window.safeApp.mutableData.newPublic(storedNameAndTag.name, storedNameAndTag.typeTag);

  connectingMessage.className = connectingMessage.className.replace("show", "");

},

getItems: async function() {
  const entries = await window.linkedMD.getEntries();
  let entriesList = await entries.listEntries();
  let items = [];
  entriesList.forEach((entry) => {
    const value = entry.value;
    if (value.buf.length == 0) return;
    const parsedValue = JSON.parse(value.buf);
    const stringKey = entry.key.toString();
    items.push({ key: stringKey, value: parsedValue, version: value.version });
  });
  return items;
},

getSelectedEntryVersion: async function(radioKey) {
  let selectedEntry = await window.linkedMD.get(radioKey); 
  return selectedEntry.version
},

insertItem: async function(key, value) {
  const mutations = await window.safeApp.mutableData.newMutation();
  await mutations.insert(key, JSON.stringify(value));
  await window.linkedMD.applyEntriesMutation(mutations);
},

updateItem: async function(key, value, version) {
  const mutations = await window.safeApp.mutableData.newMutation();
  await mutations.update(key, JSON.stringify(value), version + 1);
  await window.linkedMD.applyEntriesMutation(mutations);
},

deleteItems: async function(items) {
  const mutations = await window.safeApp.mutableData.newMutation();
  items.forEach(async (item) => {
    await mutations.delete(item.key, item.version + 1);
  });
  await window.linkedMD.applyEntriesMutation(mutations);
},

checkForSavedTheme: async function() {
  window.publicContainer = await window.safeApp.auth.getContainer('_public');
  try {
    let keyName = 'Home-Page-Theme';
    let theme = await window.publicContainer.get(keyName);
    //return theme;
  }
  catch (err) { 
    return false
  }
},

getTheme: async function() {
  if (await this.checkForSavedTheme() == false) {
  const mutations = await window.safeApp.mutableData.newMutation();
  await mutations.insert('Home-Page-Theme', JSON.stringify('neon'));
  await window.publicContainer.applyEntriesMutation(mutations);
  return 'neon';
  }
  else {
  let keyName = 'Home-Page-Theme';
    let savedTheme = await window.publicContainer.get(keyName);
    const value = savedTheme;
    const theme = JSON.parse(value.buf); 
    return theme;
  }
},

getThemeVersion: async function() {
  let theme = await window.publicContainer.get('Home-Page-Theme'); 
  return theme.version
},

updateTheme: async function(value, version) {
  const mutations = await window.safeApp.mutableData.newMutation();
  await mutations.update('Home-Page-Theme', JSON.stringify(value), version + 1);
  await window.publicContainer.applyEntriesMutation(mutations);
},
}