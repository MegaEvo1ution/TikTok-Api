from __future__ import annotations

from typing import TYPE_CHECKING, AsyncIterator, ClassVar, Optional

from ..exceptions import InvalidResponseException

if TYPE_CHECKING:
    from ..tiktok import TikTokApi
    from .playlist import Playlist
    from .video import Video


class User:
    """
    A TikTok User.

    Example Usage:
        .. code-block:: python

            user = api.user(username='therock')
    """

    parent: ClassVar[TikTokApi]

    user_id: str
    """The  ID of the user."""
    sec_uid: str
    """The sec UID of the user."""
    username: str
    """The username of the user."""
    as_dict: dict
    """The raw data associated with this user."""

    def __init__(
        self,
        username: Optional[str] = None,
        user_id: Optional[str] = None,
        sec_uid: Optional[str] = None,
        data: Optional[dict] = None,
    ):
        """
        You must provide the username or (user_id and sec_uid) otherwise this
        will not function correctly.
        """
        self.__update_id_sec_uid_username(user_id, sec_uid, username)
        if data is not None:
            self.as_dict = data
            self.__extract_from_data()

    async def info(self, **kwargs) -> dict:
        """
        Returns a dictionary of information associated with this User.

        Returns:
            dict: A dictionary of information associated with this User.

        Raises:
            InvalidResponseException: If TikTok returns an invalid response, or one we don't understand.

        Example Usage:
            .. code-block:: python

                user_data = await api.user(username='therock').info()
                # Or with secUid:
                user_data = await api.user(sec_uid='MS4wLjABAAAA...').info()
        """

        username = getattr(self, "username", None)
        sec_uid = getattr(self, "sec_uid", None)

        if not username and not sec_uid:
            raise TypeError(
                "You must provide the username or sec_uid when creating this class."
            )

        url_params = {
            "secUid": sec_uid if sec_uid is not None else "",
            "uniqueId": username if username is not None else "",
            "msToken": kwargs.get("ms_token"),
        }

        resp = await self.parent.make_request(
            url="https://www.tiktok.com/api/user/detail/",
            params=url_params,
            headers=kwargs.get("headers"),
            session=kwargs.get("session"),
            session_index=kwargs.get("session_index"),
        )

        if resp is None:
            raise InvalidResponseException(resp, "TikTok returned an invalid response.")

        self.as_dict = resp
        self.__extract_from_data()
        return resp

    async def playlists(self, count=20, cursor=0, **kwargs) -> AsyncIterator[Playlist]:
        """
        Returns a user's playlists.

        Returns:
            async iterator/generator: Yields TikTokApi.playlist objects.

        Raises:
            InvalidResponseException: If TikTok returns an invalid response, or one we don't understand.

        Example Usage:
            .. code-block:: python

                async for playlist in await api.user(username='therock').playlists():
                    # do something
        """

        sec_uid = getattr(self, "sec_uid", None)
        if sec_uid is None or sec_uid == "":
            await self.info(**kwargs)
        found = 0

        while found < count:
            params = {
                "secUid": self.sec_uid,
                "count": min(count, 20),
                "cursor": cursor,
            }

            resp = await self.parent.make_request(
                url="https://www.tiktok.com/api/user/playlist",
                params=params,
                headers=kwargs.get("headers"),
                session=kwargs.get("session"),
                session_index=kwargs.get("session_index"),
            )

            if resp is None:
                raise InvalidResponseException(
                    resp, "TikTok returned an invalid response."
                )

            for playlist in resp.get("playList", []):
                yield self.parent.playlist(data=playlist)
                found += 1

            if not resp.get("hasMore", False):
                return

            cursor = resp.get("cursor")

    async def videos(self, count=30, cursor=0, **kwargs) -> AsyncIterator[Video]:
        """
        Returns a user's videos.

        Args:
            count (int): The amount of videos you want returned.
            cursor (int): The the offset of videos from 0 you want to get.

        Returns:
            async iterator/generator: Yields TikTokApi.video objects.

        Raises:
            InvalidResponseException: If TikTok returns an invalid response, or one we don't understand.

        Example Usage:
            .. code-block:: python

                async for video in api.user(username="davidteathercodes").videos():
                    # do something
        """
        sec_uid = getattr(self, "sec_uid", None)
        if sec_uid is None or sec_uid == "":
            await self.info(**kwargs)

        found = 0
        while found < count:
            params = {
                "secUid": self.sec_uid,
                "count": 35,
                "cursor": cursor,
            }

            resp = await self.parent.make_request(
                url="https://www.tiktok.com/api/post/item_list/",
                params=params,
                headers=kwargs.get("headers"),
                session=kwargs.get("session"),
                session_index=kwargs.get("session_index"),
            )

            if resp is None:
                raise InvalidResponseException(
                    resp, "TikTok returned an invalid response."
                )

            for video in resp.get("itemList", []):
                yield self.parent.video(data=video)
                found += 1

            if not resp.get("hasMore", False):
                return

            cursor = resp.get("cursor")

    async def videos_page(self, count=30, cursor=0, **kwargs) -> dict:
        """
        Returns a page of user's videos with pagination info.

        Unlike videos() which is a generator, this returns a single page
        with cursor and hasMore for manual pagination control.

        Args:
            count (int): The amount of videos you want returned (max ~35 per page).
            cursor (int): The cursor for pagination (0 for first page).

        Returns:
            dict: {
                "videos": List[Video],
                "cursor": str | None,
                "hasMore": bool
            }

        Raises:
            InvalidResponseException: If TikTok returns an invalid response.
        """
        sec_uid = getattr(self, "sec_uid", None)
        if sec_uid is None or sec_uid == "":
            await self.info(**kwargs)

        params = {
            "secUid": self.sec_uid,
            "count": min(count, 35),  # TikTok max is ~35 per request
            "cursor": cursor,
        }

        resp = await self.parent.make_request(
            url="https://www.tiktok.com/api/post/item_list/",
            params=params,
            headers=kwargs.get("headers"),
            session=kwargs.get("session"),
            session_index=kwargs.get("session_index"),
        )

        if resp is None:
            raise InvalidResponseException(
                resp, "TikTok returned an invalid response."
            )

        videos = [self.parent.video(data=v) for v in resp.get("itemList", [])]

        return {
            "videos": videos,
            "cursor": resp.get("cursor"),
            "hasMore": resp.get("hasMore", False),
        }

    async def liked(
        self, count: int = 30, cursor: int = 0, **kwargs
    ) -> AsyncIterator[Video]:
        """
        Returns a user's liked posts if public.

        Args:
            count (int): The amount of recent likes you want returned.
            cursor (int): The the offset of likes from 0 you want to get.

        Returns:
            async iterator/generator: Yields TikTokApi.video objects.

        Raises:
            InvalidResponseException: If TikTok returns an invalid response,
                the user's likes are private, or one we don't understand.

        Example Usage:
            .. code-block:: python

                async for like in api.user(username="davidteathercodes").liked():
                    # do something
        """
        sec_uid = getattr(self, "sec_uid", None)
        if sec_uid is None or sec_uid == "":
            await self.info(**kwargs)

        found = 0
        while found < count:
            params = {
                "secUid": self.sec_uid,
                "count": 35,
                "cursor": cursor,
            }

            resp = await self.parent.make_request(
                url="https://www.tiktok.com/api/favorite/item_list",
                params=params,
                headers=kwargs.get("headers"),
                session=kwargs.get("session"),
                session_index=kwargs.get("session_index"),
            )

            if resp is None:
                raise InvalidResponseException(
                    resp, "TikTok returned an invalid response."
                )

            for video in resp.get("itemList", []):
                yield self.parent.video(data=video)
                found += 1

            if not resp.get("hasMore", False):
                return

            cursor = resp.get("cursor")

    def __extract_from_data(self):
        data = self.as_dict
        keys = data.keys()

        if "userInfo" in keys:
            user_data = data["userInfo"].get("user", {})
            # Check if user data is empty (TikTok returns empty user for invalid/banned accounts)
            if not user_data or "id" not in user_data:
                raise InvalidResponseException(
                    data,
                    "TikTok returned empty user data. The user may not exist, be banned, or the request was blocked."
                )
            self.__update_id_sec_uid_username(
                user_data["id"],
                user_data["secUid"],
                user_data["uniqueId"],
            )
        else:
            self.__update_id_sec_uid_username(
                data["id"],
                data["secUid"],
                data["uniqueId"],
            )

        if None in (self.username, self.user_id, self.sec_uid):
            User.parent.logger.error(
                f"Failed to create User with data: {data}\nwhich has keys {data.keys()}"
            )

    def __update_id_sec_uid_username(self, id, sec_uid, username):
        self.user_id = id
        self.sec_uid = sec_uid
        self.username = username

    def __repr__(self):
        return self.__str__()

    def __str__(self):
        username = getattr(self, "username", None)
        user_id = getattr(self, "user_id", None)
        sec_uid = getattr(self, "sec_uid", None)
        return f"TikTokApi.user(username='{username}', user_id='{user_id}', sec_uid='{sec_uid}')"
