import LoadingBar from 'react-top-loading-bar';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { setProgress } from '@/store/progressSlice';

export function LoadingBarProvider() {
    const progress = useSelector((state: RootState) => state.progress.value);
    const dispatch = useDispatch();

    return (
        <LoadingBar
            color="#fff"
            progress={progress}
            onLoaderFinished={() => dispatch(setProgress(0))}
        />
    );
}
