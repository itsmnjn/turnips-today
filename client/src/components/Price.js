import React from 'react'

const Price = ({ price, url }) => (
	<div className="price-container">
		<a
			className="price-link"
			href={url}
			target="_blank"
			rel="noopener noreferrer"
		>
			<div className="price">
				<img src="bellbag.png" alt="A bag of bells" />
				<p className="price-number">{price}</p>
			</div>
		</a>
	</div>
)

export default Price
