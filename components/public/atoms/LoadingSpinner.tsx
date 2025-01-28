import { RingLoader as Loader } from "react-spinners";

function LoadingSpinner({ loading = true, size = 100 }) {
 if (!loading) return null;

 return (
   <div style={{
     position: 'relative',
     width: size,
     height: size
   }}>
     <div style={{
       position: 'absolute',
       top: 0,
       left: 0,
       zIndex: 2,
       animation: 'fade 2s infinite'
     }}>
       <Loader loading={loading} size={size} color="#36d7b7" />
     </div>
     <div style={{
       position: 'absolute', 
       top: 0,
       left: 0,
       zIndex: 1
     }}>
       <Loader loading={loading} size={size} color="#ff0000" />
     </div>
     <style>{`
       @keyframes fade {
         0% { opacity: 0.3; }
         50% { opacity: 0.8; }
         100% { opacity: 0.3; }
       }
     `}</style>
   </div>
 );
}

export default LoadingSpinner;