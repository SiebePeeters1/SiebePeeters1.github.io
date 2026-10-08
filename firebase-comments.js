const firebaseConfig = {
  apiKey: "AIzaSyC9x7DIJ9bEDnkmxoXAH3GamALb4TggSF8",
  authDomain: "portfolio-c75c0.firebaseapp.com",
  projectId: "portfolio-c75c0",
  storageBucket: "portfolio-c75c0.firebasestorage.app",
  messagingSenderId: "597680700141",
  appId: "1:597680700141:web:f37a4f90949e1325fcaae4"
};

window.postCommentsReady = (async () => {
  const version = '11.10.0';
  const [appSdk, firestoreSdk] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${version}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${version}/firebase-firestore.js`)
  ]);
  const app = appSdk.initializeApp(firebaseConfig);
  const db = firestoreSdk.getFirestore(app);

  return {
    subscribe(postId, onComments, onError) {
      const commentsQuery = firestoreSdk.query(
        firestoreSdk.collection(db, 'comments'),
        firestoreSdk.where('postId', '==', postId),
        firestoreSdk.orderBy('createdAt', 'desc'),
        firestoreSdk.limit(100)
      );

      return firestoreSdk.onSnapshot(commentsQuery, snapshot => {
        const comments = snapshot.docs.map(document => {
          const data = document.data({ serverTimestamps: 'estimate' });
          return {
            username: data.username,
            text: data.text,
            createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null
          };
        }).reverse();
        onComments(comments);
      }, onError);
    },

    add(postId, username, text) {
      return firestoreSdk.addDoc(firestoreSdk.collection(db, 'comments'), {
        postId,
        username,
        text,
        createdAt: firestoreSdk.serverTimestamp()
      });
    }
  };
})().catch(error => {
  console.error('Firebase-reacties konden niet worden geïnitialiseerd.', error);
  throw error;
});
window.postCommentsReady.catch(() => {});
