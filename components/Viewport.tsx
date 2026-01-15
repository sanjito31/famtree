
interface ViewportProps {
    onMouseDown: (e: React.MouseEvent) => void,
    onMouseMove: (e: React.MouseEvent) => void,
    onMouseUp: () => void,
    onMouseLeave: () => void,
    children: React.ReactNode
}

export default function Viewport( 
{ 
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    children    
}: ViewportProps ) {
    return(
        <div 
            className="overflow-hidden w-screen h-screen relative border border-red-500"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
        >
            {children}
        </div>
    )
}