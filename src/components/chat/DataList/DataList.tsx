import { RefObject, useContext, useLayoutEffect, useRef } from 'react';
import { Badge, Divider, List, useTheme } from '@mui/material';
import { ListItem, MessageStatus } from '../..';
import { useAuth } from '../../../hooks';
import { ChatsAndFriendsContext } from '../../../contexts';
import { getMember, scrollToSelected } from '../../../helpers';

const DataList = ({
  dense = false,
  disableGutters = false,
  dividerVariant,
  data,
  selectedChat,
  handleClickListItem,
  className,
  scrollDependencies = [],
}: any) => {
  const theme = useTheme();
  const { auth: { _id = '' } = {} } = useAuth();
  const { isHomeButtonClicked } = useContext(ChatsAndFriendsContext);
  const listRef = useRef<HTMLUListElement | null>(null);
  const listItemsRef = useRef<HTMLDivElement[] | null[]>([]);

  useLayoutEffect(() => {
    if (listRef?.current) {
      listRef.current.scrollTop = 0;
    }
  }, [isHomeButtonClicked]);

  useLayoutEffect(() => {
    const scrollSelected = () => {
      if (
        listRef?.current &&
        listItemsRef?.current?.length &&
        data?.length &&
        selectedChat
      ) {
        scrollToSelected(listRef, listItemsRef, data, selectedChat);
      }
    };

    scrollSelected();

    window.addEventListener('resize', scrollSelected);

    return () => {
      window.removeEventListener('resize', scrollSelected);
    };
  }, [data, selectedChat, ...scrollDependencies]);

  const renderSecondary = (item: any, chatDetails: any) => {
    const msg = item?.lastMessage;
    let isComponent = false;
    let component = null;

    if (msg) {
      isComponent = true;
      component = (
        <div
          style={{
            display: 'flex',
            gap: '0.25rem',
            alignItems: 'center',
          }}
        >
          {msg?.sender?._id && msg?.sender?._id === _id ? (
            <MessageStatus msg={msg} selectedChat={item} />
          ) : null}
          <span
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {msg?.message}
          </span>
        </div>
      );
    } else {
      component = chatDetails?.email;
    }

    return {
      isComponent,
      component,
    };
  };

  const renderList = (
    item: any,
    idx: number,
    selected: boolean,
    handleClick: any,
    itemsRef: RefObject<HTMLDivElement[] | null[]>,
  ) => {
    const isPrivateChat = item?.type === 'private';
    const isGroupChat = item?.type === 'group';
    const isFriend = item?.type === 'friend';

    const { currentMember, otherMember } = getMember(item?.members, _id);

    let chatDetails: any;

    if (isPrivateChat || isFriend) {
      chatDetails = otherMember;
    }

    if (isGroupChat) {
      chatDetails = item?.groupDetails;
    }

    const { isComponent, component } = renderSecondary(item, chatDetails);

    if (chatDetails) {
      return (
        <div key={item?._id}>
          <ListItem
            disableGutters={disableGutters}
            ref={(el) => {
              if (itemsRef?.current) {
                itemsRef.current[idx] = el;
              }
            }}
            btnProps={{
              textProps: {
                primary: chatDetails?.name,
                secondary: component,
                slotProps: {
                  primary: {
                    ...(otherMember?.unreadMessagesCount // to do
                      ? {
                          fontWeight: 600,
                        }
                      : {}),
                  },
                  secondary: {
                    ...(isComponent ? { component: 'div' as any } : {}),
                    ...(otherMember?.unreadMessagesCount // to do
                      ? {
                          fontWeight: 700,
                          style: {
                            color: theme.palette.text.primary,
                          },
                        }
                      : {}),
                  },
                },
                style: {
                  WebkitLineClamp: 1,
                },
              },
              avatarProps: {
                src: chatDetails?.picture,
              },
              endIcon: (
                <Badge
                  badgeContent={currentMember?.unreadMessagesCount}
                  color="secondary"
                  overlap="circular"
                  sx={{ mr: '0.5rem' }}
                />
              ),
              onClick: (_: any) => handleClick(_, item, chatDetails),
              selected,
            }}
          />
          <Divider
            variant={
              dividerVariant || (disableGutters ? 'fullWidth' : 'middle')
            }
            sx={
              disableGutters ? { ml: '5px', mr: '5px' } : { ml: 2.5, mr: 2.5 }
            }
          />
        </div>
      );
    }

    return null;
  };

  if (!data?.length) return null;

  return (
    <List
      dense={dense}
      disablePadding
      className={className}
      ref={listRef}
      sx={{ overflow: 'auto', width: '100%', minHeight: '4.6rem' }}
    >
      {data?.map((item: any, idx: number) =>
        renderList(
          item,
          idx,
          item?._id && selectedChat?._id && item?._id === selectedChat?._id,
          handleClickListItem,
          listItemsRef,
        ),
      )}
    </List>
  );
};

export default DataList;
