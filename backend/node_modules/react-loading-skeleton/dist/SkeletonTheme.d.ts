import { ReactElement, PropsWithChildren } from 'react';
import { SkeletonStyleProps } from './SkeletonStyleProps';
export declare type SkeletonThemeProps = PropsWithChildren<SkeletonStyleProps>;
export declare function SkeletonTheme({ children, ...styleOptions }: SkeletonThemeProps): ReactElement;
