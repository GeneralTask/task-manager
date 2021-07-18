export enum FetchStatus {
    LOADING,
    SUCCESS,
    ERROR,
}

export enum DragState {
    noDrag,
    isDragging,
    fetchDelayed, // enabled if a tasks request was delayed because a drag was active during it
}
